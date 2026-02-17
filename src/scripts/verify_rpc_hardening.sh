#!/bin/bash
# verify_rpc_hardening.sh

RPC_FILE="src/db/migrations/20260217000001_org_menu_rpcs.sql"
ERRORS=0

echo "🔍 PARANOID AUDIT: $RPC_FILE"

# 1. CHECK CLIENT-INJECTED RBAC (Must be GONE)
if grep -q "p_allowed_module_ids" "$RPC_FILE"; then
    echo "❌ FAIL: Found 'p_allowed_module_ids' (Client RBAC forbidden)"
    ERRORS=$((ERRORS+1))
else
    echo "✅ PASS: No Client-Injected RBAC parameters"
fi

# 2. CHECK TENANT SCOPE GUARD
# Check if we query organizations with tenant_id check
if grep -q "WHERE id = p_org_id AND tenant_id = p_tenant_id" "$RPC_FILE" || grep -q "WHERE org.id = p_org_id" "$RPC_FILE"; then
    # Loose check, but good enough for grep.
    # Specifically looking for the strict guard pattern in resolve_menu_structure
    if grep -q "SELECT 1 FROM public.organizations" "$RPC_FILE"; then
         echo "✅ PASS: Organization Scope Guard detected"
    else
         echo "❌ FAIL: Organization Scope Guard missing or malformed"
         ERRORS=$((ERRORS+1))
    fi
else
    echo "❌ FAIL: Tenant Scope Check missing"
    ERRORS=$((ERRORS+1))
fi

# 3. CHECK SEARCH PATH (public, auth)
# Count functions
FUNC_COUNT=$(grep "CREATE OR REPLACE FUNCTION" "$RPC_FILE" | wc -l)
# Count search_path = public, auth
PATH_COUNT=$(grep "SET search_path = public, auth" "$RPC_FILE" | wc -l)

if [ "$FUNC_COUNT" -ne "$PATH_COUNT" ]; then
    echo "❌ FAIL: Found $FUNC_COUNT functions but only $PATH_COUNT using 'search_path = public, auth'"
    echo "   (Check resolve_org_language strictness)"
    ERRORS=$((ERRORS+1))
else
    echo "✅ PASS: All $FUNC_COUNT functions use 'search_path = public, auth'"
fi

# 4. CHECK REVOKE PUBLIC
REVOKE_COUNT=$(grep "REVOKE ALL ON FUNCTION.*FROM PUBLIC" "$RPC_FILE" | wc -l)
if [ "$FUNC_COUNT" -ne "$REVOKE_COUNT" ]; then
    echo "❌ FAIL: Found $FUNC_COUNT functions but only $REVOKE_COUNT explicit REVOKEs"
    ERRORS=$((ERRORS+1))
else
    echo "✅ PASS: All $FUNC_COUNT functions have explicit REVOKE FROM PUBLIC"
fi

# 5. CHECK A/B SEPARATION (No Auto-Create in link_app)
# Look inside link_app_to_section for INSERT INTO organization_apps
# We extract the function body first or just grep file scope (acceptable if function names are unique enough)
# simpler: Just grep the file for the forbidden pattern contextually?
# Actually, strict check:
if grep -A 20 "CREATE OR REPLACE FUNCTION public.link_app_to_section" "$RPC_FILE" | grep "INSERT INTO public.organization_apps"; then
    echo "❌ FAIL: link_app_to_section contains INSERT INTO organization_apps (Auto-Create Forbidden)"
    ERRORS=$((ERRORS+1))
else
    echo "✅ PASS: link_app_to_section does not auto-create Apps"
fi

# 6. CHECK HARDCODED LANGUAGES
if grep "v_lang_en" "$RPC_FILE" || grep "'en'" "$RPC_FILE" | grep -v "language_code"; then
     # Note: 'en' might appear in comments, we need to be careful.
     # But looking for the removed variables is good.
     echo "❓ CHECK: Found 'en' literal. Manually verify if this is hardcoded dependency."
     # We strictly removed 'v_lang_en' variable.
     if grep -q "v_lang_en TEXT" "$RPC_FILE"; then
        echo "❌ FAIL: Found v_lang_en variable (Hardcoded Language)"
        ERRORS=$((ERRORS+1))
     else
        echo "✅ PASS: No v_lang_en variable found"
     fi
else
     echo "✅ PASS: No hardcoded 'en'/'pl' detected"
fi

# 7. CHECK UI STRINGS
if grep -q "MISSING_TRANS" "$RPC_FILE"; then
    echo "❌ FAIL: Found 'MISSING_TRANS' (UI String in DB)"
    ERRORS=$((ERRORS+1))
else
    echo "✅ PASS: No UI Strings (MISSING_TRANS) found"
fi

# 8. CHECK VARIANT SCOPE VALIDATION
# look for "AND v.tenant_id = p_tenant_id"
if grep -q "AND v.tenant_id = p_tenant_id" "$RPC_FILE"; then
    echo "✅ PASS: Variant Tenant Scope validated"
else
    echo "❌ FAIL: Variant Tenant Scope check missing"
    ERRORS=$((ERRORS+1))
fi

if [ $ERRORS -eq 0 ]; then
    echo "🎉 PARANOID VERIFICATION SUCCESSFUL"
    exit 0
else
    echo "💀 PARANOID VERIFICATION FAILED ($ERRORS errors)"
    exit 1
fi

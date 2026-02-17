#!/bin/bash
set -euo pipefail

echo "=== 0) Repo sanity ==="
git status --porcelain || true
echo

echo "=== 1) Docs structure vs template (architecture chapters) ==="
ls -la docs/architecture || true
echo

echo "=== 2) Hard invariants: server-admin / admin client / direct writes / tenant filtering ==="
echo "[server-admin leakage]"
grep -r "server-admin" src/app src/core src/infra | grep -v "seed" | grep -v "migration" || echo "✅ clean"
echo

echo "[createAdminClient usage]"
grep -r "createAdminClient" src/app src/modules src/core || echo "✅ none"
echo

echo "[direct writes edit_locks]"
grep -R "from(['\"]edit_locks['\"])" -n src | grep -E "insert|update|delete" && (echo "❌ direct writes found" && exit 1) || echo "✅ no direct writes"
echo

echo "[tenant_id must not be filtered in-memory]"
# Exclude the scripts directory to avoid self-matching
grep -r "\.filter(.*tenant_id" src --exclude-dir=scripts && (echo "❌ in-memory tenant filtering found" && exit 1) || echo "✅ ok"
echo

echo "=== 3) 2FA hardening checks (cookie + middleware + guards + RPCs) ==="
echo "[global /2fa forbidden]"
grep -R "(/2fa|\"/2fa\"|'/2fa')" -n src/app | grep -v "/admin/t/" && (echo "❌ global /2fa usage found" && exit 1) || echo "✅ ok"
echo

echo "[tenant-aware 2FA route exists]"
find src/app -type f -path "*admin/t/*/2fa/*" -print | head -n 50
echo

echo "[middleware transport gate present]"
test -f src/middleware.ts && echo "✅ src/middleware.ts exists" || (echo "❌ missing src/middleware.ts" && exit 1)
echo

echo "[middleware must NOT query DB]"
# Fixed grep pattern to be compatible with different grep versions and avoid "parentheses not balanced"
grep -E "createAuthClient|createAdminClient|supabase\.|rpc\(|from\(" -r -n src/middleware.ts && (echo "❌ DB/client usage in middleware" && exit 1) || echo "✅ ok"
echo

echo "[twofa cookie: hex signature + timingSafeEqual + tenantId in payload]"
# Check for either Node.js digest('hex') OR WebCrypto bufferToHex/toString(16)
if grep -r "digest('hex')" src/core/security/twofaCookie.ts >/dev/null || grep -r "toString(16)" src/core/security/twofaCookie.ts >/dev/null; then
    echo "✅ hex signature (Node or WebCrypto)"
else
    echo "❌ missing hex signature implementation"
    exit 1
fi

# Check for either Node.js timingSafeEqual OR WebCrypto crypto.subtle.verify
if grep -r "timingSafeEqual" src/core/security/twofaCookie.ts >/dev/null || grep -r "crypto.subtle.verify" src/core/security/twofaCookie.ts >/dev/null; then
    echo "✅ timing safe verification (Node or WebCrypto)"
else
    echo "❌ missing constant-time verification"
    exit 1
fi

grep -R "tenantId" -n src/core/security/twofaCookie.ts >/dev/null && echo "✅ tenantId in payload" || (echo "❌ missing tenantId in payload" && exit 1)
echo

echo "[DB replay protection must run on every request: requireTwoFaVerified usage]"
grep -R "requireTwoFaVerified" -n src/app | head -n 50
echo

echo "=== 4) DB migrations: security definer + search_path + force RLS + revoke ==="
echo "[security definer]"
grep -R "security definer" -n src/db/migrations | head -n 50 || echo "⚠️ none found"
echo

echo "[search_path must be public, auth for definer functions]"
grep -R "security definer" -n src/db/migrations -A 8 | grep -E "search_path|SET search_path" || echo "⚠️ verify manually"
echo

echo "[force row level security]"
grep -R "force row level security" -n src/db/migrations | head -n 50 || echo "⚠️ none found"
echo

echo "[revoke all on function from public, anon]"
grep -R "revoke all on function .* from public, anon" -n src/db/migrations | head -n 50 || echo "⚠️ verify revoke statements"
echo

echo "=== 5) Repo tenant scoping in repositories ==="
# Fixed grep pattern: In Basic Regex (grep without -E), \( starts a group. We want literal (, so do not escape it.
grep -R "\.eq(['\"]tenant_id['\"]" -n src/infra/repositories | head -n 80
echo

echo "=== 6) No cross-module imports ==="
grep -r "from '@/modules/" src/modules && (echo "❌ cross-module import detected" && exit 1) || echo "✅ ok"
echo

echo "=== 7) Build ==="
npm run build
echo "✅ AUDIT PASSED"

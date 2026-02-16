#!/bin/bash

echo "Starting Strict Hierarchy Verification..."

# Global failure flag
FAILED=0

fail() {
    echo "❌ FAIL: $1"
    if [ -n "$2" ]; then echo "$2"; fi
    FAILED=1
}

pass() {
    echo "✅ PASS: $1"
}

# Check Empty: Command MUST NOT return output (grep should return 1)
check_empty() {
    name="$1"
    cmd="$2"
    
    echo "Checking: $name..."
    # capture output, allow failure
    if out=$(eval "$cmd"); then
        # Command succeeded (found matches) -> FAIL
        fail "$name" "Found violations:\n$out"
    else
        # Command failed (no matches) -> PASS
        pass "$name"
    fi
}

# Check Exists: Command MUST return matches (grep should return 0)
check_exists() {
    name="$1"
    cmd="$2"

    echo "Checking: $name..."
    if eval "$cmd" > /dev/null 2>&1; then
        pass "$name"
    else
        fail "$name" "Command failed to find match: $cmd"
    fi
}

# 1. RPC-Only Enforcement (Direct Writes)
# Exclude src/db/migrations from this check, as it defines the RPCs/RLS.
DIRS="src/app src/core src/infra src/modules src/shared"

check_empty "No Direct Writes to companies" "grep -R \"from(['\\\"]companies['\\\"])\" $DIRS | grep -E \"insert|update|delete\""
check_empty "No Direct Writes to organizations" "grep -R \"from(['\\\"]organizations['\\\"])\" $DIRS | grep -E \"insert|update|delete\""
check_empty "No Direct Writes to projects" "grep -R \"from(['\\\"]projects['\\\"])\" $DIRS | grep -E \"insert|update|delete\""
check_empty "No Direct Writes to service_offerings" "grep -R \"from(['\\\"]service_offerings['\\\"])\" $DIRS | grep -E \"insert|update|delete\""
check_empty "No Direct Writes to groups" "grep -R \"from(['\\\"]groups['\\\"])\" $DIRS | grep -E \"insert|update|delete\""

# 2. RPC Existence (In Migrations)
check_exists "RPC: create_group" "grep -R \"create or replace function public.create_group\" src/db/migrations"
check_exists "RPC: create_organization" "grep -R \"create or replace function public.create_organization\" src/db/migrations"
check_exists "RPC: create_company" "grep -R \"create or replace function public.create_company\" src/db/migrations"
check_exists "RPC: create_project" "grep -R \"create or replace function public.create_project\" src/db/migrations"
check_exists "RPC: create_service_offering" "grep -R \"create or replace function public.create_service_offering\" src/db/migrations"
check_exists "RPC: create_company_role" "grep -R \"create or replace function public.create_company_role\" src/db/migrations"

# 3. Force RLS
check_exists "Force RLS: companies" "grep -R \"alter table public.companies force row level security\" src/db/migrations"
check_exists "Force RLS: projects" "grep -R \"alter table public.projects force row level security\" src/db/migrations"

# 4. Tenant Filter in Repos
check_exists "Repo Tenant Filter" "grep -R \".eq('tenant_id'\" src/infra/repositories"

if [ $FAILED -eq 1 ]; then
    echo "Check FAILED. Fix violations."
    exit 1
else
    echo "🎉 All Strict Hierarchy Invariants Verified!"
    exit 0
fi

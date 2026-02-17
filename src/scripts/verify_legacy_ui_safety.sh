#!/bin/bash
set -euo pipefail

TARGET_DIR="src/components/legacy"

echo "🔍 Verifying Legacy UI Safety in $TARGET_DIR..."

if [ ! -d "$TARGET_DIR" ]; then
    echo "⚠️  Directory $TARGET_DIR does not exist. (Assuming pre-port state)."
    exit 0
fi

# Function to run check
check_forbidden() {
    local pattern="$1"
    local message="$2"
    
    if grep -r "$pattern" "$TARGET_DIR"; then
        echo "❌ FAIL: Found forbidden pattern '$pattern' - $message"
        exit 1
    else
        echo "✅ PASS: No '$pattern' found."
    fi
}

# The Gauntlet
check_forbidden "localStorage" "Client-side storage is banned."
check_forbidden "sessionStorage" "Client-side storage is banned."
check_forbidden "useAuth" "Legacy auth hooks are banned."
check_forbidden "axios" "Legacy network clients are banned."
check_forbidden "fetch(" "Data fetching in UI is banned."
check_forbidden "router.push" "Internal routing logic in UI is banned."
check_forbidden 'href="/admin' "Hardcoded admin links are banned."
check_forbidden "createClient" "Direct Supabase usage in UI is banned."

echo "---------------------------------------------------"
echo "✅ SAFE UI CHECK PASSED: No forbidden patterns found."

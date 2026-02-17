#!/bin/bash
set -e

echo "🔍 Verifying Strict I18n Architecture..."

# 1. CORE PURITY: Core must not import i18n
if grep -r "from '@/shared/i18n'" src/core; then
    echo "❌ FATAL: Core layer imports i18n! Strict violation."
    grep -r "from '@/shared/i18n'" src/core
    exit 1
fi
if grep -r "@/shared/i18n" src/core; then
    echo "❌ FATAL: Core layer references i18n! Strict violation."
    grep -r "@/shared/i18n" src/core
    exit 1
fi

# 2. MODULE INDEPENDENCE: Shared i18n must not import module locales
if grep -r "from '@/modules/.*/ui/locales'" src/shared/i18n; then
    echo "❌ FATAL: Shared i18n imports specific module locales! Circular dependency risk."
    exit 1
fi

# 3. NO MIDDLEWARE: Middleware must not set locale
if grep "x-locale" src/middleware.ts; then
    echo "❌ FATAL: Middleware sets 'x-locale'! Violation of no-middleware rule."
    exit 1
fi
if grep "@/shared/i18n" src/middleware.ts; then
    echo "❌ FATAL: Middleware imports shared i18n! Violation."
    exit 1
fi

# 4. DEPENDENCY CHECK: No i18next allowed
if grep -E "\"(i18next|react-i18next|next-i18next)\"" package.json; then
    echo "❌ FATAL: 'i18next' found in package.json! Strict violation."
    exit 1
fi

echo "✅ PARANOID AUDIT PASSED: I18n is strict."

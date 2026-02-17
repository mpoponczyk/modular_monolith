#!/bin/bash
set -euo pipefail

TEMPLATE_DIR="docs/template/architecture"
CURRENT_DIR="docs/architecture"

echo "=== 1) Sprawdzenie istnienia katalog√≥w ==="
test -d "$TEMPLATE_DIR" || (echo "❌ TEMPLATE_DIR not found: $TEMPLATE_DIR" && exit 1)
test -d "$CURRENT_DIR" || (echo "❌ CURRENT_DIR not found: $CURRENT_DIR" && exit 1)
echo "✅ Both directories exist"
echo

echo "=== 2) Brakujące pliki względem template ==="
for f in $(ls "$TEMPLATE_DIR"); do
  if [ ! -f "$CURRENT_DIR/$f" ]; then
    echo "❌ MISSING in current: $f"
  fi
done
echo

echo "=== 3) Nadmiarowe pliki (nieobecne w template) ==="
for f in $(ls "$CURRENT_DIR"); do
  if [ ! -f "$TEMPLATE_DIR/$f" ]; then
    echo "⚠️ EXTRA in current: $f"
  fi
done
echo

echo "=== 4) Diff sekcja-po-sekcji ==="
for f in $(ls "$TEMPLATE_DIR"); do
  if [ -f "$CURRENT_DIR/$f" ]; then
    echo
    echo "----- DIFF: $f -----"
    diff -u "$TEMPLATE_DIR/$f" "$CURRENT_DIR/$f" || true
  fi
done
echo

echo "=== 5) Sprawdzenie zgodności nagłówków H1/H2 ==="
for f in $(ls "$TEMPLATE_DIR"); do
  if [ -f "$CURRENT_DIR/$f" ]; then
    echo
    echo "----- HEADERS CHECK: $f -----"
    echo "[Template]"
    grep "^#\|^##" "$TEMPLATE_DIR/$f" || true
    echo
    echo "[Current]"
    grep "^#\|^##" "$CURRENT_DIR/$f" || true
  fi
done

echo
echo "=== TEMPLATE DRIFT AUDIT COMPLETE ==="

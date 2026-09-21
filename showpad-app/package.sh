#!/usr/bin/env bash
# Packages the Showpad app into showpad-app/<identifier>.<version>.showpad
# Run from the repo root: bash showpad-app/package.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR"

# Read identifier and version from manifest
IDENTIFIER=$(python3 -c "import json,sys; d=json.load(open('$SCRIPT_DIR/manifest.json')); print(d['identifier'])")
VERSION=$(python3 -c "import json,sys; d=json.load(open('$SCRIPT_DIR/manifest.json')); print(d['version'])")
OUT="$OUT_DIR/$IDENTIFIER.$VERSION.showpad"

# Remove old bundle for this version if it exists
rm -f "$OUT"

cd "$SCRIPT_DIR"
zip -X -j "$OUT" manifest.json index.html config.json

echo "Done → $(basename "$OUT")"
echo "Location: $OUT"

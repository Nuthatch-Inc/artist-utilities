#!/usr/bin/env bash
set -euo pipefail

# Build macOS .app and .dmg for Artist Utilities
# Run on macOS host (CI or local mac)

PYTHON=python3

# Ensure pyinstaller is present
$PYTHON -m pip install --upgrade pip
$PYTHON -m pip install pyinstaller

# Debug info for CI
echo "PWD: $(pwd)"
echo "Listing repo files (top-level):"
ls -la .
echo "Listing build dir:"
ls -la build || true

# Determine project root (two levels up from script)
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
SPEC_PATH="$PROJECT_ROOT/build/artist_utilities.spec"

echo "SPEC_PATH: $SPEC_PATH"
ls -la "$SPEC_PATH" || true

cd "$PROJECT_ROOT"

if [[ ! -f "$SPEC_PATH" ]]; then
  echo "Spec file not found at: $SPEC_PATH"
  echo "Current dir: $(pwd)"
  ls -la "$PROJECT_ROOT" || true
  exit 1
fi

# Clean previous builds
rm -rf build dist Artist-Utilities-macos.dmg

# Run PyInstaller using the spec
pyinstaller --noconfirm --clean "$SPEC_PATH"

APP_NAME="Artist Utilities.app"
DMG_NAME="Artist-Utilities-macos.dmg"

# Create a temporary folder and copy the .app into an Applications folder
TMPDIR=$(mktemp -d)
mkdir -p "$TMPDIR/Applications"
cp -R dist/"$APP_NAME" "$TMPDIR/Applications/"

# Create a compressed DMG
hdiutil create -volname "Artist Utilities" -srcfolder "$TMPDIR" -ov -format UDZO "$DMG_NAME"

# Cleanup
rm -rf "$TMPDIR"

echo "Created: $DMG_NAME"
ls -lh "$DMG_NAME"

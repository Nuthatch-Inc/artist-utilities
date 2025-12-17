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

# Run PyInstaller using the spec
# Use the project's Python to invoke PyInstaller directly to avoid cd/path issues on CI
if [[ ! -f "$SPEC_PATH" ]]; then
  echo "Spec file not found at: $SPEC_PATH"
  exit 1
fi

echo "Invoking PyInstaller via: $PYTHON -m PyInstaller --noconfirm --clean $SPEC_PATH"
$PYTHON -m PyInstaller --noconfirm --clean "$SPEC_PATH" || {
  echo "PyInstaller failed. Listing build dir contents:"; ls -la "${PROJECT_ROOT}/build" || true; exit 1
}

# Ensure dist dir exists
if [[ ! -d "$PROJECT_ROOT/dist" ]]; then
  echo "Build did not produce a dist/ directory. Listing project root:"; ls -la "$PROJECT_ROOT"; exit 1
fi

# Move back to project root (ensures subsequent steps run relative to root)
cd "$PROJECT_ROOT"

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

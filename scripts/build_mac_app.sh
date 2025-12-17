#!/usr/bin/env bash
set -euo pipefail

# Build macOS .app and .dmg for Artist Utilities
# Run on macOS host (CI or local mac)

PYTHON=python3

# Ensure pyinstaller is present
$PYTHON -m pip install --upgrade pip
$PYTHON -m pip install pyinstaller

# Clean previous builds
rm -rf build dist Artist-Utilities-macos.dmg

# Run PyInstaller using the spec
pyinstaller --noconfirm --clean build/artist_utilities.spec

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

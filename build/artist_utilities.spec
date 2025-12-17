# PyInstaller spec for Artist Utilities (macOS)
# Simple tkinter app - no heavy Qt dependencies

import os
from PyInstaller.building.build_main import Analysis, PYZ, EXE, COLLECT, BUNDLE

block_cipher = None

# Get absolute path to the main script
script_path = os.path.abspath(os.path.join(os.getcwd(), 'src_py', 'app.py'))

a = Analysis(
    [script_path],
    pathex=[os.path.abspath('.')],
    binaries=[],
    datas=[],
    hiddenimports=['tkinter', 'tkinter.ttk', 'tkinter.filedialog', 'tkinter.messagebox'],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    exclude_binaries=True,
    name='artist_utilities',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='artist_utilities',
)

# Check if icon exists and is valid (not a placeholder)
icon_path = os.path.abspath('resources/icon.icns')
use_icon = os.path.isfile(icon_path) and os.path.getsize(icon_path) > 1024

# Create macOS app bundle
app = BUNDLE(
    coll,
    name='Artist Utilities.app',
    icon=icon_path if use_icon else None,
    bundle_identifier='com.nuthatch.artist-utilities',
)

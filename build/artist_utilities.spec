# PyInstaller spec for Artist Utilities (macOS)
# Collects PySide6 files needed for runtime

import os
from PyInstaller.utils.hooks import collect_all
from PyInstaller.building.build_main import Analysis, PYZ, EXE, COLLECT, BUNDLE

block_cipher = None

# Collect all PySide6 related files to ensure Qt plugins / libs included
_datas, _binaries, _hiddenimports = collect_all('PySide6')

script_path = os.path.abspath(os.path.join(os.getcwd(), 'src_py', 'app.py'))

a = Analysis(
    [script_path],
    pathex=[os.path.abspath('.')],
    binaries=_binaries,
    datas=_datas,
    hiddenimports=_hiddenimports,
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

# Create an app bundle named "Artist Utilities.app" (macOS)
app = BUNDLE(
    coll,
    name='Artist Utilities.app',
    icon='resources/icon.icns'
)

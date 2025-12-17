# PyInstaller spec for Artist Utilities (macOS)
# Collects PySide6 files needed for runtime

import os
from PyInstaller.utils.hooks import collect_all
from PyInstaller.building.build_main import Analysis, PYZ, EXE, COLLECT, BUNDLE

block_cipher = None

# Collect all PySide6 related files to ensure Qt plugins / libs included
_datas, _binaries, _hiddenimports = collect_all('PySide6')

# Deduplicate datas and binaries by destination to avoid symlink conflicts when
# PyInstaller assembles frameworks (some Qt frameworks contain identical
# 'Versions/Current/Resources' entries which can cause FileExistsError).
def _dedupe_by_dest(entries):
    seen = set()
    out = []
    for entry in entries:
        # entry formats can vary: (src, dest) or (src, dest, type) or simple str paths
        dest = None
        try:
            if isinstance(entry, (list, tuple)) and len(entry) >= 2:
                dest = entry[1]
            elif isinstance(entry, str):
                dest = os.path.basename(entry)
            else:
                # Fallback: take basename of first element if possible
                dest = os.path.basename(entry[0])
        except Exception:
            dest = str(entry)

        # Normalize dest
        dest_norm = os.path.normpath(dest)

        if dest_norm in seen:
            # Duplicate destination detected. Try to disambiguate by prefixing
            # with a framework or parent folder name derived from the source path.
            src_path = None
            if isinstance(entry, (list, tuple)) and len(entry) >= 1:
                src_path = entry[0]
            elif isinstance(entry, str):
                src_path = entry
            if src_path:
                # Try to find a nearby framework name in the source path
                fw_name = None
                parts = src_path.split(os.sep)
                for p in parts:
                    if p.endswith('.framework'):
                        fw_name = p
                        break
                if not fw_name:
                    # Fallback to parent directory name
                    fw_name = os.path.basename(os.path.dirname(src_path))
                # Create a new unique dest by prefixing
                new_dest = os.path.join(fw_name, dest_norm)
                # update dest_norm to use the new path
                dest_norm = os.path.normpath(new_dest)
                # If this new dest is still seen, skip to avoid infinite loop
                if dest_norm in seen:
                    continue
                # When entry is tuple-like, replace the dest in the entry copy
                if isinstance(entry, (list, tuple)) and len(entry) >= 2:
                    entry = (entry[0], dest_norm) + tuple(entry[2:])
                else:
                    entry = (entry, dest_norm)
            else:
                continue
        seen.add(dest_norm)
        out.append(entry)
    return out

_datas = _dedupe_by_dest(_datas)
_binaries = _dedupe_by_dest(_binaries)
_hiddenimports = list(dict.fromkeys(_hiddenimports))

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
    icon=(os.path.abspath('resources/icon.icns') if os.path.isfile('resources/icon.icns') and os.path.getsize('resources/icon.icns') > 1024 else None)
)

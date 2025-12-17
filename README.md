# Artist Utilities

Utilities for artists — small Node and Python tools for workflows and assets.

## Contents

- `src/` — Node source
- `tests/node/` — Node tests
- `src_py/` — Python source
- `tests_py/` — Python tests
- `.github/workflows/ci.yml` — CI for Node + Python

## Setup

- Node: `npm install` then `npm test`
- Python: `python -m venv .venv && pip install -r requirements-dev.txt && pytest`


### Local prototype (Python) 🔧

To run the simple PySimpleGUI prototype locally:

- Install dev dependencies: `pip install -r requirements-dev.txt`
- Run: `python src_py/app.py`

This will open a minimal window titled `Artist Utilities`.

**Notes about GUI backends:**
- The project prefers the Qt backend (PySide6 + `PySimpleGUIQt`). The dev requirements include `PySide6` and `PySimpleGUIQt` so the setup script will install them into the `.venv`.
- If you prefer the Tk backend, install `PySimpleGUI` instead (Tk requires Python built with Tcl/Tk).

## Packaging & distribution (macOS)

We provide a GitHub Actions workflow to build a macOS `.app` and a distributable `.dmg` automatically.

Local build (macOS):

1. Ensure you have a mac machine or runner with Xcode command line tools.
2. Run the build script:
   - `chmod +x scripts/build_mac_app.sh && ./scripts/build_mac_app.sh`
3. The build creates `dist/Artist Utilities.app` and `Artist-Utilities-macos.dmg`.

CI build: `/.github/workflows/build-macos.yml` produces artifacts on push or via manual dispatch.

Notes:
- For production distribution you should **codesign** and **notarize** the `.app`/`.dmg` using an Apple Developer account to avoid Gatekeeper warnings.
- Replace `resources/icon.icns` with a real icon before release so the app has a proper icon.

## License

MIT © Nuthatch

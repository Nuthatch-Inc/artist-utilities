#!/usr/bin/env bash
set -euo pipefail

# Create a virtual environment in .venv (no-op if it exists)
python3 -m venv .venv

# Activate it in this shell
# shellcheck source=/dev/null
. .venv/bin/activate

# Upgrade pip and install dev requirements
python -m pip install --upgrade pip
pip install -r requirements-dev.txt

cat <<'EOF'
Setup complete ✅

To run the prototype GUI locally:
  source .venv/bin/activate
  python src_py/app.py

If you see messages about PySimpleGUI being on a private index, follow the printed instructions to reinstall it from the project's index.
EOF

"""Simple PySimpleGUI (Qt preferred) wireframe for Artist Utilities.

Run: python src_py/app.py
"""

# Prefer Qt backend (PySimpleGUIQt). If not available, fallback to PySimpleGUI (Tk).
try:
    import PySimpleGUIQt as sg  # type: ignore
    backend = "qt"
except Exception:
    try:
        import PySimpleGUI as sg  # type: ignore
        backend = "tk"
    except ImportError:
        print("Neither PySimpleGUIQt nor PySimpleGUI is installed.")
        print("Install Qt backend (recommended):")
        print("  python3 -m pip install --user PySide6 PySimpleGUIQt")
        print("Or install Tk backend (if you prefer Tk):")
        print("  python3 -m pip install --user PySimpleGUI")
        raise

# Basic API sanity check
if not (hasattr(sg, "Window") and hasattr(sg, "Button")):
    print("The installed PySimpleGUI variant does not expose expected APIs (Window/Button/etc.).")
    if backend == "qt":
        print("Try reinstalling Qt packages:")
        print("  python3 -m pip uninstall PySide6 PySimpleGUIQt && python3 -m pip install --user PySide6 PySimpleGUIQt")
    else:
        print("Try reinstalling Tk packages:")
        print("  python3 -m pip uninstall PySimpleGUI && python3 -m pip install --user PySimpleGUI")
    raise SystemExit(1)


def main():
    print(f"Starting Artist Utilities (backend={backend})")

    try:
        # theme may not be available in some builds; tolerate failures
        if hasattr(sg, "theme"):
            sg.theme("LightBlue")
    except Exception:
        print("Unable to set theme — continuing without it.")

    layout = [
        [sg.Text("Artist Utilities", font=("Any", 20), justification="center")],
        [sg.HorizontalSeparator()],
        [sg.Text("Welcome — prototype UI coming soon", justification="center")],
        [sg.Button("Quit")],
    ]

    window = sg.Window("Artist Utilities", layout, element_justification="c", resizable=True)

    while True:
        event, values = window.read()
        if event in (sg.WIN_CLOSED, "Quit"):
            break

    window.close()


if __name__ == "__main__":
    main()

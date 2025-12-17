"""Artist Utilities - Simple GUI for image processing.

Uses tkinter (built into Python) for maximum compatibility and easy packaging.
Run: python src_py/app.py
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from pathlib import Path


class ArtistUtilitiesApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Artist Utilities")
        self.root.geometry("500x400")
        self.root.minsize(400, 300)
        
        # Configure style
        style = ttk.Style()
        style.configure("Title.TLabel", font=("Helvetica", 20, "bold"))
        style.configure("Info.TLabel", font=("Helvetica", 12))
        
        # Main frame with padding
        main_frame = ttk.Frame(root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(main_frame, text="Artist Utilities", style="Title.TLabel")
        title_label.pack(pady=(0, 10))
        
        # Separator
        ttk.Separator(main_frame, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=10)
        
        # Welcome message
        welcome_label = ttk.Label(
            main_frame, 
            text="Welcome! This tool helps you process images.\n\nFeatures coming soon:\n• Resize images\n• Rename files in batch\n• Convert formats",
            style="Info.TLabel",
            justify=tk.CENTER
        )
        welcome_label.pack(pady=20)
        
        # Button frame
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(pady=20)
        
        # Select files button (placeholder)
        self.select_btn = ttk.Button(
            button_frame, 
            text="Select Images...", 
            command=self.select_files
        )
        self.select_btn.pack(side=tk.LEFT, padx=5)
        
        # Quit button
        quit_btn = ttk.Button(button_frame, text="Quit", command=root.quit)
        quit_btn.pack(side=tk.LEFT, padx=5)
        
        # Status bar
        self.status_var = tk.StringVar(value="Ready")
        status_bar = ttk.Label(main_frame, textvariable=self.status_var, relief=tk.SUNKEN)
        status_bar.pack(fill=tk.X, side=tk.BOTTOM, pady=(10, 0))

    def select_files(self):
        """Open file dialog to select images."""
        filetypes = [
            ("Image files", "*.png *.jpg *.jpeg *.gif *.bmp *.tiff"),
            ("All files", "*.*")
        ]
        files = filedialog.askopenfilenames(
            title="Select Images",
            filetypes=filetypes
        )
        if files:
            count = len(files)
            self.status_var.set(f"Selected {count} file(s)")
            messagebox.showinfo(
                "Files Selected", 
                f"You selected {count} file(s).\n\nProcessing features coming soon!"
            )


def main():
    print("Starting Artist Utilities...")
    root = tk.Tk()
    app = ArtistUtilitiesApp(root)
    root.mainloop()
    print("Artist Utilities closed.")


if __name__ == "__main__":
    main()

"""Artist Utilities - Simple GUI for image processing.

Uses tkinter (built into Python) for maximum compatibility and easy packaging.
Run: python src_py/app.py
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from pathlib import Path

try:
    from image_processor import process_image
    PROCESSOR_AVAILABLE = True
except ImportError:
    PROCESSOR_AVAILABLE = False


class ArtistUtilitiesApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Artist Utilities")
        self.root.geometry("600x520")
        self.root.minsize(500, 450)
        
        self.selected_files = []
        self.output_dir = None
        
        # Configure style
        style = ttk.Style()
        style.configure("Title.TLabel", font=("Helvetica", 20, "bold"))
        style.configure("Info.TLabel", font=("Helvetica", 12))
        style.configure("Small.TLabel", font=("Helvetica", 10))
        
        # Main frame with padding
        main_frame = ttk.Frame(root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(main_frame, text="Artist Utilities", style="Title.TLabel")
        title_label.pack(pady=(0, 10))
        
        # Separator
        ttk.Separator(main_frame, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=10)
        
        # Instructions
        instructions = ttk.Label(
            main_frame, 
            text="Auto-generate 72 DPI + thumbnail versions of your images\n\n"
                 "1. Select your 300 DPI image(s)\n"
                 "2. Choose output folder\n"
                 "3. Click Process!\n\n"
                 "Creates: title72.jpg (900px) + title_thumb.jpg (150px)\n"
                 "In folder: Title/",
            style="Info.TLabel",
            justify=tk.CENTER
        )
        instructions.pack(pady=10)
        
        # Button frame
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(pady=15)
        
        # Select files button
        self.select_btn = ttk.Button(
            button_frame, 
            text="1. Select Images...", 
            command=self.select_files
        )
        self.select_btn.pack(side=tk.LEFT, padx=5)
        
        # Output folder button
        self.output_btn = ttk.Button(
            button_frame, 
            text="2. Choose Output Folder...", 
            command=self.select_output
        )
        self.output_btn.pack(side=tk.LEFT, padx=5)
        
        # Process button
        self.process_btn = ttk.Button(
            button_frame, 
            text="3. Process!", 
            command=self.process_images,
            state=tk.DISABLED
        )
        self.process_btn.pack(side=tk.LEFT, padx=5)
        
        # Info labels
        info_frame = ttk.Frame(main_frame)
        info_frame.pack(pady=10, fill=tk.X)
        
        self.files_label = ttk.Label(info_frame, text="No images selected", style="Small.TLabel")
        self.files_label.pack()
        
        self.output_label = ttk.Label(info_frame, text="No output folder selected", style="Small.TLabel")
        self.output_label.pack()
        
        # Quit button
        ttk.Button(main_frame, text="Quit", command=root.quit).pack(pady=10)
        
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
            self.selected_files = list(files)
            count = len(files)
            self.files_label.config(text=f"{count} image(s) selected")
            self.status_var.set(f"Selected {count} file(s)")
            self.update_process_button()

    def select_output(self):
        """Open folder dialog to select output directory."""
        folder = filedialog.askdirectory(title="Choose Output Folder")
        if folder:
            self.output_dir = Path(folder)
            self.output_label.config(text=f"Output: {folder}")
            self.status_var.set(f"Output folder set")
            self.update_process_button()

    def update_process_button(self):
        """Enable process button if both files and output are selected."""
        if self.selected_files and self.output_dir:
            self.process_btn.config(state=tk.NORMAL)
        else:
            self.process_btn.config(state=tk.DISABLED)

    def process_images(self):
        """Process all selected images."""
        if not PROCESSOR_AVAILABLE:
            messagebox.showerror(
                "Error", 
                "Pillow is not installed.\n\nRun: pip install Pillow"
            )
            return
        
        if not self.selected_files or not self.output_dir:
            return
        
        self.status_var.set("Processing...")
        self.root.update()
        
        results = []
        errors = []
        
        for i, filepath in enumerate(self.selected_files):
            filename = Path(filepath).name
            self.status_var.set(f"Processing {i+1}/{len(self.selected_files)}: {filename}")
            self.root.update()
            
            try:
                result = process_image(filepath, self.output_dir)
                results.append(result)
            except Exception as e:
                errors.append(f"{filename}: {str(e)}")
        
        # Show results
        success_count = len(results)
        if errors:
            error_msg = "\n".join(errors[:5])
            if len(errors) > 5:
                error_msg += f"\n... and {len(errors) - 5} more errors"
            messagebox.showwarning(
                "Completed with errors",
                f"Processed {success_count} image(s).\n\nErrors:\n{error_msg}"
            )
        else:
            folders = set(r['folder_name'] for r in results)
            folder_list = ", ".join(folders)
            messagebox.showinfo(
                "Done!",
                f"Successfully processed {success_count} image(s)!\n\n"
                f"Created folders: {folder_list}\n\n"
                f"Files saved to:\n{self.output_dir}"
            )
        
        self.status_var.set(f"Done! {success_count} image(s) processed.")


def main():
    print("Starting Artist Utilities...")
    root = tk.Tk()
    app = ArtistUtilitiesApp(root)
    root.mainloop()
    print("Artist Utilities closed.")


if __name__ == "__main__":
    main()

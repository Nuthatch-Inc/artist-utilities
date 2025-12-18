"""Image processing utilities for Artist Utilities.

Handles:
- Parsing filenames to extract title (removes trailing numbers like "300")
- Resizing images to specific heights while maintaining aspect ratio
- Setting DPI metadata
- Creating organized output folders
"""

import re
from pathlib import Path
from typing import Tuple

try:
    from PIL import Image
except ImportError:
    Image = None


def check_pillow():
    """Check if Pillow is available."""
    if Image is None:
        raise ImportError(
            "Pillow is required for image processing.\n"
            "Install it with: pip install Pillow"
        )


def parse_filename(filename: str) -> Tuple[str, str]:
    """
    Extract the base title from a filename like 'title300.jpg'.
    
    Removes trailing numbers (like DPI indicators) from the base name.
    
    Args:
        filename: The original filename (e.g., 'MyArt300.jpg')
    
    Returns:
        Tuple of (base_title, extension) e.g., ('MyArt', '.jpg')
    """
    path = Path(filename)
    stem = path.stem
    ext = path.suffix.lower()
    
    # Remove trailing numbers (like "300" from "title300")
    base_title = re.sub(r'\d+$', '', stem)
    
    # If the entire name was numbers, use the original stem
    if not base_title:
        base_title = stem
    
    return base_title, ext


def capitalize_title(title: str) -> str:
    """
    Capitalize the first letter of the title for folder naming.
    """
    if not title:
        return title
    return title[0].upper() + title[1:]


def resize_to_height(img: 'Image.Image', target_height: int) -> 'Image.Image':
    """
    Resize an image to a specific height while maintaining aspect ratio.
    """
    check_pillow()
    
    original_width, original_height = img.size
    aspect_ratio = original_width / original_height
    new_width = int(target_height * aspect_ratio)
    
    resized = img.resize((new_width, target_height), Image.Resampling.LANCZOS)
    return resized


def save_with_dpi(img: 'Image.Image', output_path: Path, dpi: int = 72, quality: int = 90):
    """
    Save an image with specific DPI metadata.
    """
    check_pillow()
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Convert to RGB if necessary (for JPEG output)
    if output_path.suffix.lower() in ('.jpg', '.jpeg'):
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
    
    save_kwargs = {'dpi': (dpi, dpi)}
    if output_path.suffix.lower() in ('.jpg', '.jpeg'):
        save_kwargs['quality'] = quality
    
    img.save(output_path, **save_kwargs)


def process_image(
    input_path: Path,
    output_dir: Path,
    medium_height: int = 900,
    thumb_height: int = 150,
    output_dpi: int = 72,
    quality: int = 90
) -> dict:
    """
    Process a single image: create 72 DPI version and thumbnail.
    
    Workflow:
    1. Parse filename to extract title (e.g., 'MyArt300.jpg' -> 'MyArt')
    2. Create folder with capitalized title (e.g., 'MyArt/')
    3. Generate 900px height version as 'title72.jpg'
    4. Generate 150px height thumbnail as 'title_thumb.jpg'
    5. If original is not JPEG, also save in original format
    """
    check_pillow()
    
    input_path = Path(input_path)
    output_dir = Path(output_dir)
    
    # Parse filename
    base_title, original_ext = parse_filename(input_path.name)
    folder_name = capitalize_title(base_title)
    
    # Create output folder
    folder_path = output_dir / folder_name
    folder_path.mkdir(parents=True, exist_ok=True)
    
    # Load image
    img = Image.open(input_path)
    
    # Track created files
    created_files = []
    
    # 1. Create 72 DPI version (900px height) as JPEG
    medium_img = resize_to_height(img, medium_height)
    medium_path = folder_path / f"{base_title}72.jpg"
    save_with_dpi(medium_img, medium_path, dpi=output_dpi, quality=quality)
    created_files.append(medium_path)
    
    # 2. Create thumbnail (150px height) as JPEG
    thumb_img = resize_to_height(img, thumb_height)
    thumb_path = folder_path / f"{base_title}_thumb.jpg"
    save_with_dpi(thumb_img, thumb_path, dpi=output_dpi, quality=quality)
    created_files.append(thumb_path)
    
    # 3. If original was not JPEG, also save in original format
    if original_ext.lower() not in ('.jpg', '.jpeg'):
        medium_orig_path = folder_path / f"{base_title}72{original_ext}"
        save_with_dpi(medium_img, medium_orig_path, dpi=output_dpi)
        created_files.append(medium_orig_path)
        
        thumb_orig_path = folder_path / f"{base_title}_thumb{original_ext}"
        save_with_dpi(thumb_img, thumb_orig_path, dpi=output_dpi)
        created_files.append(thumb_orig_path)
    
    return {
        'folder': folder_path,
        'files': created_files,
        'title': base_title,
        'folder_name': folder_name
    }


def process_multiple_images(input_paths: list, output_dir: Path, progress_callback=None, **kwargs) -> list:
    """
    Process multiple images.
    """
    results = []
    total = len(input_paths)
    
    for i, input_path in enumerate(input_paths):
        if progress_callback:
            progress_callback(i + 1, total, Path(input_path).name)
        
        try:
            result = process_image(input_path, output_dir, **kwargs)
            result['success'] = True
            result['input'] = input_path
        except Exception as e:
            result = {
                'success': False,
                'input': input_path,
                'error': str(e)
            }
        
        results.append(result)
    
    return results

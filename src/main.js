import JSZip from 'jszip';

const fileInput = document.getElementById('fileInput');
const folderInput = document.getElementById('folderInput');
const fileInfo = document.getElementById('fileInfo');
const previewCanvas = document.getElementById('previewCanvas');
const processBtn = document.getElementById('processBtn');
const progressInfo = document.getElementById('progressInfo');
const downloadLinks = document.getElementById('downloadLinks');

// Original image info elements
const origName = document.getElementById('origName');
const origDpi = document.getElementById('origDpi');
const origWidthIn = document.getElementById('origWidthIn');
const origHeightIn = document.getElementById('origHeightIn');
const origWidthPx = document.getElementById('origWidthPx');
const origHeightPx = document.getElementById('origHeightPx');

// Small image inputs
const smallName = document.getElementById('smallName');
const smallDpi = document.getElementById('smallDpi');
const smallWidthIn = document.getElementById('smallWidthIn');
const smallHeightIn = document.getElementById('smallHeightIn');
const smallWidthPx = document.getElementById('smallWidthPx');
const smallHeightPx = document.getElementById('smallHeightPx');

// Thumbnail inputs
const thumbName = document.getElementById('thumbName');
const thumbDpi = document.getElementById('thumbDpi');
const thumbWidthIn = document.getElementById('thumbWidthIn');
const thumbHeightIn = document.getElementById('thumbHeightIn');
const thumbWidthPx = document.getElementById('thumbWidthPx');
const thumbHeightPx = document.getElementById('thumbHeightPx');

let originalImage = null;
let originalFilename = '';
let aspectRatio = 1; // width / height
let detectedDpi = null; // DPI extracted from image metadata
let selectedFiles = []; // For batch processing
let isBatchMode = false;

// Extract DPI from JPEG/JFIF/EXIF metadata
async function extractDpiFromFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target.result;
      const view = new DataView(buffer);
      
      // Check for JPEG magic bytes
      if (view.getUint16(0) !== 0xFFD8) {
        resolve(null); // Not a JPEG
        return;
      }
      
      let offset = 2;
      while (offset < buffer.byteLength - 4) {
        const marker = view.getUint16(offset);
        
        // APP0 (JFIF) marker - 0xFFE0
        if (marker === 0xFFE0) {
          const length = view.getUint16(offset + 2);
          // Check JFIF identifier
          if (view.getUint8(offset + 4) === 0x4A && // J
              view.getUint8(offset + 5) === 0x46 && // F
              view.getUint8(offset + 6) === 0x49 && // I
              view.getUint8(offset + 7) === 0x46) { // F
            const units = view.getUint8(offset + 11);
            const xDensity = view.getUint16(offset + 12);
            const yDensity = view.getUint16(offset + 14);
            
            if (units === 1) {
              // Units are dots per inch
              resolve(Math.round((xDensity + yDensity) / 2));
              return;
            } else if (units === 2) {
              // Units are dots per cm, convert to DPI
              resolve(Math.round(((xDensity + yDensity) / 2) * 2.54));
              return;
            }
          }
          offset += 2 + length;
          continue;
        }
        
        // APP1 (EXIF) marker - 0xFFE1
        if (marker === 0xFFE1) {
          const length = view.getUint16(offset + 2);
          // Check for EXIF identifier
          if (view.getUint8(offset + 4) === 0x45 && // E
              view.getUint8(offset + 5) === 0x78 && // x
              view.getUint8(offset + 6) === 0x69 && // i
              view.getUint8(offset + 7) === 0x66) { // f
            // Parse TIFF header within EXIF
            const tiffStart = offset + 10;
            const byteOrder = view.getUint16(tiffStart);
            const littleEndian = byteOrder === 0x4949; // II = little endian
            
            const ifdOffset = view.getUint32(tiffStart + 4, littleEndian);
            const ifdStart = tiffStart + ifdOffset;
            const numEntries = view.getUint16(ifdStart, littleEndian);
            
            let xRes = null, yRes = null, resUnit = 2; // default to inches
            
            for (let i = 0; i < numEntries; i++) {
              const entryOffset = ifdStart + 2 + (i * 12);
              if (entryOffset + 12 > buffer.byteLength) break;
              
              const tag = view.getUint16(entryOffset, littleEndian);
              const type = view.getUint16(entryOffset + 2, littleEndian);
              const valueOffset = view.getUint32(entryOffset + 8, littleEndian);
              
              // XResolution (0x011A) or YResolution (0x011B)
              if (tag === 0x011A || tag === 0x011B) {
                // RATIONAL type (5) - stored as offset to two ULONGs
                if (type === 5) {
                  const ratOffset = tiffStart + valueOffset;
                  if (ratOffset + 8 <= buffer.byteLength) {
                    const numerator = view.getUint32(ratOffset, littleEndian);
                    const denominator = view.getUint32(ratOffset + 4, littleEndian);
                    const res = denominator > 0 ? numerator / denominator : 0;
                    if (tag === 0x011A) xRes = res;
                    else yRes = res;
                  }
                }
              }
              // ResolutionUnit (0x0128)
              if (tag === 0x0128) {
                resUnit = view.getUint16(entryOffset + 8, littleEndian);
              }
            }
            
            if (xRes || yRes) {
              let dpi = (xRes || yRes);
              if (xRes && yRes) dpi = (xRes + yRes) / 2;
              // Convert to DPI if needed
              if (resUnit === 3) dpi *= 2.54; // cm to inches
              resolve(Math.round(dpi));
              return;
            }
          }
          offset += 2 + length;
          continue;
        }
        
        // Skip other markers
        if ((marker & 0xFF00) === 0xFF00 && marker !== 0xFFD9) {
          const length = view.getUint16(offset + 2);
          offset += 2 + length;
        } else {
          offset++;
        }
      }
      
      resolve(null); // No DPI found
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });
}

fileInput.addEventListener('change', async (ev) => {
  const f = ev.target.files?.[0];
  if (!f) return;
  
  isBatchMode = false;
  selectedFiles = [f];
  originalFilename = f.name;
  fileInfo.textContent = `${f.name} (${Math.round(f.size/1024)} KB)`;
  
  // Try to extract DPI from file metadata
  const extractedDpi = await extractDpiFromFile(f);
  
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    originalImage = img;
    aspectRatio = img.width / img.height;
    drawPreview(img);
    processBtn.disabled = false;
    downloadLinks.innerHTML = '';
    progressInfo.textContent = '';
    
    // Populate original image info
    detectedDpi = extractedDpi || 72; // Default to 72 if not found
    
    // Parse filename for output names (strip DPI suffix if it matches)
    const { base, ext } = parseFilename(originalFilename, extractedDpi);
    origName.textContent = originalFilename;
    origDpi.textContent = extractedDpi ? detectedDpi : `${detectedDpi} (default)`;
    origWidthPx.textContent = img.width;
    origHeightPx.textContent = img.height;
    origWidthIn.textContent = (img.width / detectedDpi).toFixed(2);
    origHeightIn.textContent = (img.height / detectedDpi).toFixed(2);
    
    // Update output file names with new format: base_dpi_small.jpg, base_dpi_thumb.jpg
    const smallDpiVal = smallDpi.value;
    const thumbDpiVal = thumbDpi.value;
    smallName.textContent = `${base}_${smallDpiVal}_small.jpg`;
    thumbName.textContent = `${base}_${thumbDpiVal}_thumb.jpg`;
    
    // Calculate small image dimensions based on 900px height default
    updateRowFromHeightPx('small', 900);
    
    // Calculate thumbnail dimensions based on 150px height default
    updateRowFromHeightPx('thumb', 150);
    
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    fileInfo.textContent = 'Failed to load image.';
    processBtn.disabled = true;
  };
  img.src = url;
});

// Folder selection handler
folderInput.addEventListener('change', async (ev) => {
  const files = Array.from(ev.target.files || []).filter(f => 
    f.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(f.name)
  );
  
  if (files.length === 0) {
    fileInfo.textContent = 'No images found in folder';
    return;
  }
  
  isBatchMode = true;
  selectedFiles = files;
  fileInfo.textContent = `${files.length} image(s) selected for batch processing`;
  
  // Show first image as preview
  const firstFile = files[0];
  originalFilename = firstFile.name;
  const extractedDpi = await extractDpiFromFile(firstFile);
  
  const url = URL.createObjectURL(firstFile);
  const img = new Image();
  img.onload = () => {
    originalImage = img;
    aspectRatio = img.width / img.height;
    drawPreview(img);
    processBtn.disabled = false;
    downloadLinks.innerHTML = '';
    progressInfo.textContent = '';
    
    detectedDpi = extractedDpi || 72;
    const { base } = parseFilename(originalFilename, extractedDpi);
    
    origName.textContent = `${firstFile.name} (+${files.length - 1} more)`;
    origDpi.textContent = extractedDpi ? detectedDpi : `${detectedDpi} (default)`;
    origWidthPx.textContent = img.width;
    origHeightPx.textContent = img.height;
    origWidthIn.textContent = (img.width / detectedDpi).toFixed(2);
    origHeightIn.textContent = (img.height / detectedDpi).toFixed(2);
    
    // Show placeholder names for batch
    smallName.textContent = `[name]_${smallDpi.value}_small.jpg`;
    thumbName.textContent = `[name]_${thumbDpi.value}_thumb.jpg`;
    
    updateRowFromHeightPx('small', 900);
    updateRowFromHeightPx('thumb', 150);
    
    URL.revokeObjectURL(url);
  };
  img.src = url;
});

function drawPreview(img) {
  const maxH = 300;
  const scale = Math.min(1, maxH / img.height);
  previewCanvas.width = img.width * scale;
  previewCanvas.height = img.height * scale;
  previewCanvas.getContext('2d').drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height);
}

function parseFilename(name, detectedDpi = null) {
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot) : '';
  const stem = dot > 0 ? name.slice(0, dot) : name;
  
  // Only strip trailing numbers if they exactly match the detected DPI
  // e.g., "image240.jpg" with 240 DPI -> base = "image"
  // but "myimage-2.jpg" -> base = "myimage-2" (keep the -2)
  let base = stem;
  if (detectedDpi) {
    const dpiStr = String(detectedDpi);
    if (stem.endsWith(dpiStr)) {
      base = stem.slice(0, -dpiStr.length) || stem;
    }
  }
  return { base, ext };
}

function capitalizeTitle(title) {
  if (!title) return title;
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function resizeToHeight(img, targetHeight) {
  const aspectRatio = img.width / img.height;
  const newWidth = Math.round(targetHeight * aspectRatio);
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, newWidth, targetHeight);
  return canvas;
}

async function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.9) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

// Dimension calculation helpers
function updateRowFromHeightPx(prefix, heightPx) {
  const dpi = parseInt(document.getElementById(`${prefix}Dpi`).value);
  const widthPx = Math.round(heightPx * aspectRatio);
  
  document.getElementById(`${prefix}HeightPx`).value = heightPx;
  document.getElementById(`${prefix}WidthPx`).value = widthPx;
  document.getElementById(`${prefix}HeightIn`).value = (heightPx / dpi).toFixed(2);
  document.getElementById(`${prefix}WidthIn`).value = (widthPx / dpi).toFixed(2);
}

function updateRowFromWidthPx(prefix, widthPx) {
  const dpi = parseInt(document.getElementById(`${prefix}Dpi`).value);
  const heightPx = Math.round(widthPx / aspectRatio);
  
  document.getElementById(`${prefix}WidthPx`).value = widthPx;
  document.getElementById(`${prefix}HeightPx`).value = heightPx;
  document.getElementById(`${prefix}WidthIn`).value = (widthPx / dpi).toFixed(2);
  document.getElementById(`${prefix}HeightIn`).value = (heightPx / dpi).toFixed(2);
}

function updateRowFromHeightIn(prefix, heightIn) {
  const dpi = parseInt(document.getElementById(`${prefix}Dpi`).value);
  const heightPx = Math.round(heightIn * dpi);
  updateRowFromHeightPx(prefix, heightPx);
}

function updateRowFromWidthIn(prefix, widthIn) {
  const dpi = parseInt(document.getElementById(`${prefix}Dpi`).value);
  const widthPx = Math.round(widthIn * dpi);
  updateRowFromWidthPx(prefix, widthPx);
}

function updateRowFromDpi(prefix) {
  const heightPx = parseInt(document.getElementById(`${prefix}HeightPx`).value) || 0;
  if (heightPx > 0) {
    updateRowFromHeightPx(prefix, heightPx);
  }
}

// Update displayed filenames when DPI changes
function updateDisplayedFilenames() {
  if (selectedFiles.length === 0) return;
  
  const smallDpiVal = smallDpi.value;
  const thumbDpiVal = thumbDpi.value;
  
  if (isBatchMode) {
    smallName.textContent = `[name]_${smallDpiVal}_small.jpg`;
    thumbName.textContent = `[name]_${thumbDpiVal}_thumb.jpg`;
  } else {
    const { base } = parseFilename(originalFilename, detectedDpi);
    smallName.textContent = `${base}_${smallDpiVal}_small.jpg`;
    thumbName.textContent = `${base}_${thumbDpiVal}_thumb.jpg`;
  }
}

// Event listeners for Small Image row
smallDpi.addEventListener('change', () => {
  updateRowFromDpi('small');
  updateDisplayedFilenames();
});
smallHeightPx.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  if (val > 0 && aspectRatio) updateRowFromHeightPx('small', val);
});
smallWidthPx.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  if (val > 0 && aspectRatio) updateRowFromWidthPx('small', val);
});
smallHeightIn.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  if (val > 0 && aspectRatio) updateRowFromHeightIn('small', val);
});
smallWidthIn.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  if (val > 0 && aspectRatio) updateRowFromWidthIn('small', val);
});

// Event listeners for Thumbnail row
thumbDpi.addEventListener('change', () => {
  updateRowFromDpi('thumb');
  updateDisplayedFilenames();
});
thumbHeightPx.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  if (val > 0 && aspectRatio) updateRowFromHeightPx('thumb', val);
});
thumbWidthPx.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  if (val > 0 && aspectRatio) updateRowFromWidthPx('thumb', val);
});
thumbHeightIn.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  if (val > 0 && aspectRatio) updateRowFromHeightIn('thumb', val);
});
thumbWidthIn.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  if (val > 0 && aspectRatio) updateRowFromWidthIn('thumb', val);
});

processBtn.addEventListener('click', async () => {
  if (selectedFiles.length === 0) return;
  
  processBtn.disabled = true;
  processBtn.textContent = 'Processing...';
  downloadLinks.innerHTML = '';
  progressInfo.textContent = '';
  
  const smallDpiVal = smallDpi.value;
  const thumbDpiVal = thumbDpi.value;
  const smallHeight = parseInt(smallHeightPx.value) || 900;
  const thumbHeight = parseInt(thumbHeightPx.value) || 150;
  
  try {
    const zip = new JSZip();
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      progressInfo.textContent = `Processing ${i + 1} of ${selectedFiles.length}: ${file.name}`;
      
      // Extract DPI for this file
      const fileDpi = await extractDpiFromFile(file);
      const { base, ext } = parseFilename(file.name, fileDpi);
      const folderName = capitalizeTitle(base);
      
      // Load image
      const img = await loadImage(file);
      
      // Create resized versions
      const smallCanvas = resizeToHeight(img, smallHeight);
      const thumbCanvas = resizeToHeight(img, thumbHeight);
      
      // Get or create folder
      const folder = zip.folder(folderName);
      
      // Add JPEG versions with new naming: base_dpi_small.jpg, base_dpi_thumb.jpg
      const smallJpgBlob = await canvasToBlob(smallCanvas, 'image/jpeg', 0.9);
      const thumbJpgBlob = await canvasToBlob(thumbCanvas, 'image/jpeg', 0.9);
      
      folder.file(`${base}_${smallDpiVal}_small.jpg`, smallJpgBlob);
      folder.file(`${base}_${thumbDpiVal}_thumb.jpg`, thumbJpgBlob);
      
      // If original wasn't JPEG, also add original format
      const lowerExt = ext.toLowerCase();
      if (lowerExt !== '.jpg' && lowerExt !== '.jpeg') {
        let mimeType = 'image/png';
        if (lowerExt === '.webp') mimeType = 'image/webp';
        else if (lowerExt === '.gif') mimeType = 'image/gif';
        
        const smallOrigBlob = await canvasToBlob(smallCanvas, mimeType);
        const thumbOrigBlob = await canvasToBlob(thumbCanvas, mimeType);
        
        folder.file(`${base}_${smallDpiVal}_small${ext}`, smallOrigBlob);
        folder.file(`${base}_${thumbDpiVal}_thumb${ext}`, thumbOrigBlob);
      }
    }
    
    progressInfo.textContent = 'Creating ZIP file...';
    
    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    
    // Determine ZIP filename
    const zipName = isBatchMode 
      ? `processed_images_${selectedFiles.length}.zip`
      : `${capitalizeTitle(parseFilename(selectedFiles[0].name, detectedDpi).base)}.zip`;
    
    // Show download link
    downloadLinks.innerHTML = `
      <a href="${zipUrl}" download="${zipName}" class="btn btn-success">
        ⬇️ Download ${zipName}
      </a>
      <p class="small">${selectedFiles.length} image(s) processed → ${selectedFiles.length * 2} output files</p>
    `;
    progressInfo.textContent = '';
    
  } catch (err) {
    console.error('Processing error:', err);
    downloadLinks.innerHTML = `<p class="error">Error: ${err.message}</p>`;
    progressInfo.textContent = '';
  }
  
  processBtn.textContent = 'Process Image(s)';
  processBtn.disabled = false;
});

// Helper to load image from file
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load ${file.name}`));
    };
    img.src = url;
  });
}
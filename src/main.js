import JSZip from 'jszip';

const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const previewCanvas = document.getElementById('previewCanvas');
const processBtn = document.getElementById('processBtn');
const downloadLinks = document.getElementById('downloadLinks');

let originalImage = null;
let originalFilename = '';

fileInput.addEventListener('change', (ev) => {
  const f = ev.target.files?.[0];
  if (!f) return;
  originalFilename = f.name;
  fileInfo.textContent = `${f.name} (${Math.round(f.size/1024)} KB)`;
  
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    originalImage = img;
    drawPreview(img);
    processBtn.disabled = false;
    downloadLinks.innerHTML = '';
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    fileInfo.textContent = 'Failed to load image.';
    processBtn.disabled = true;
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

function parseFilename(name) {
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot) : '';
  const stem = dot > 0 ? name.slice(0, dot) : name;
  // Remove trailing numbers (like "300" from "title300")
  const base = stem.replace(/\d+$/, '') || stem;
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

processBtn.addEventListener('click', async () => {
  if (!originalImage) return;
  
  processBtn.disabled = true;
  processBtn.textContent = 'Processing...';
  downloadLinks.innerHTML = '';
  
  try {
    const { base, ext } = parseFilename(originalFilename);
    const folderName = capitalizeTitle(base);
    
    // Create resized versions
    const mediumCanvas = resizeToHeight(originalImage, 900);
    const thumbCanvas = resizeToHeight(originalImage, 150);
    
    // Create ZIP
    const zip = new JSZip();
    const folder = zip.folder(folderName);
    
    // Always add JPEG versions
    const mediumJpgBlob = await canvasToBlob(mediumCanvas, 'image/jpeg', 0.9);
    const thumbJpgBlob = await canvasToBlob(thumbCanvas, 'image/jpeg', 0.9);
    
    folder.file(`${base}72.jpg`, mediumJpgBlob);
    folder.file(`${base}_thumb.jpg`, thumbJpgBlob);
    
    // If original wasn't JPEG, also add original format
    const lowerExt = ext.toLowerCase();
    if (lowerExt !== '.jpg' && lowerExt !== '.jpeg') {
      let mimeType = 'image/png';
      if (lowerExt === '.webp') mimeType = 'image/webp';
      else if (lowerExt === '.gif') mimeType = 'image/gif';
      
      const mediumOrigBlob = await canvasToBlob(mediumCanvas, mimeType);
      const thumbOrigBlob = await canvasToBlob(thumbCanvas, mimeType);
      
      folder.file(`${base}72${ext}`, mediumOrigBlob);
      folder.file(`${base}_thumb${ext}`, thumbOrigBlob);
    }
    
    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    
    // Show download link
    downloadLinks.innerHTML = `
      <a href="${zipUrl}" download="${folderName}.zip" class="btn btn-success">
        ⬇️ Download ${folderName}.zip
      </a>
      <p class="small">Contains: ${base}72.jpg, ${base}_thumb.jpg${lowerExt !== '.jpg' && lowerExt !== '.jpeg' ? `, ${base}72${ext}, ${base}_thumb${ext}` : ''}</p>
    `;
    
  } catch (err) {
    console.error('Processing error:', err);
    downloadLinks.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
  
  processBtn.textContent = 'Process Image (72 DPI + Thumbnail)';
  processBtn.disabled = false;
});
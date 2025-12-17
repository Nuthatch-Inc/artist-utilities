const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const previewCanvas = document.getElementById('previewCanvas');
const scaleRange = document.getElementById('scaleRange');
const scaleVal = document.getElementById('scaleVal');
const downloadBtn = document.getElementById('downloadBtn');

let originalImage = null;

function updateScaleDisplay() {
  scaleVal.textContent = `${scaleRange.value}%`;
}

scaleRange.addEventListener('input', () => {
  updateScaleDisplay();
  drawPreview();
});

fileInput.addEventListener('change', async (ev) => {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  fileInfo.textContent = `${f.name} (${Math.round(f.size/1024)} KB)`;

  const blobUrl = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    originalImage = img;
    drawPreview();
    URL.revokeObjectURL(blobUrl);
    downloadBtn.disabled = false;
  };
  img.onerror = () => {
    fileInfo.textContent = 'Failed to load image.';
    downloadBtn.disabled = true;
  };
  img.src = blobUrl;
});

function drawPreview() {
  if (!originalImage) return;
  const scale = Number(scaleRange.value) / 100;
  const w = Math.max(1, Math.round(originalImage.width * scale));
  const h = Math.max(1, Math.round(originalImage.height * scale));
  previewCanvas.width = w;
  previewCanvas.height = h;
  const ctx = previewCanvas.getContext('2d');
  ctx.clearRect(0,0,w,h);
  ctx.drawImage(originalImage, 0, 0, w, h);
}

downloadBtn.addEventListener('click', () => {
  if (!originalImage) return;
  previewCanvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'artist-utilities-edited.png';
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/png');
});

// Initialize UI
updateScaleDisplay();
/** Profile avatar limits — keep max bytes in sync with minoritiesView/storage.rules */
export const PROFILE_AVATAR_MAX_BYTES = 1024 * 1024;
export const PROFILE_AVATAR_MAX_DIMENSION = 512;

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}

function scaleDimensions(width, height, maxDim) {
  if (width <= maxDim && height <= maxDim) {
    return { width, height };
  }
  const ratio = Math.min(maxDim / width, maxDim / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function drawImageToCanvas(img, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image compression is not supported in this browser.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

async function encodeCanvasUnderLimit(canvas, maxBytes) {
  const outputType = "image/jpeg";
  let quality = 0.9;
  let blob = await canvasToBlob(canvas, outputType, quality);

  while (blob && blob.size > maxBytes && quality > 0.35) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, outputType, quality);
  }

  return { blob, outputType };
}

/**
 * Resize and compress a profile photo in the browser before upload.
 * Returns a JPEG File at most PROFILE_AVATAR_MAX_DIMENSION px and PROFILE_AVATAR_MAX_BYTES.
 */
export async function compressProfileAvatar(file) {
  if (!file || !String(file.type || "").startsWith("image/")) {
    throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
  }

  const img = await loadImageFromFile(file);
  let maxDim = PROFILE_AVATAR_MAX_DIMENSION;
  let { width, height } = scaleDimensions(img.naturalWidth, img.naturalHeight, maxDim);
  let canvas = drawImageToCanvas(img, width, height);
  let encoded = await encodeCanvasUnderLimit(canvas, PROFILE_AVATAR_MAX_BYTES);

  while (
    encoded.blob &&
    encoded.blob.size > PROFILE_AVATAR_MAX_BYTES &&
    maxDim > 192
  ) {
    maxDim = Math.round(maxDim * 0.75);
    ({ width, height } = scaleDimensions(img.naturalWidth, img.naturalHeight, maxDim));
    canvas = drawImageToCanvas(img, width, height);
    encoded = await encodeCanvasUnderLimit(canvas, PROFILE_AVATAR_MAX_BYTES);
  }

  if (!encoded.blob) {
    throw new Error("Could not compress image.");
  }
  if (encoded.blob.size > PROFILE_AVATAR_MAX_BYTES) {
    throw new Error(
      "This image is still too large after compression. Try a simpler photo or crop it first.",
    );
  }

  const baseName = String(file.name || "avatar")
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w.-]+/g, "-")
    .slice(0, 40);
  return new File([encoded.blob], `${baseName || "avatar"}.jpg`, {
    type: encoded.outputType,
    lastModified: Date.now(),
  });
}

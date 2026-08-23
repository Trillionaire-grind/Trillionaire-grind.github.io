import { HAIRSTYLES, HAIR_COLORS, hairSvg, VIEW } from "./roxanneAIHair.js";
import { measureFace, guessFace } from "./roxanneAIFace.js";
import { roxanneAIVersionLabel } from "./roxanneAIVersion.js";

const PREFS_KEY = "roxanne-look-v1";

// The reference head sits at this point in the 200x220 style space, and its
// ear-to-ear span is this many units. Both are used to map a style onto a face.
const ANCHOR = { x: 100, y: 112 };
const HEAD_SPAN = 100;
const HEAD_SPAN_FUDGE = 1.12;

/** Neutral face drawn behind each thumbnail so a style reads at a glance. */
const CHIP_FACE = `
  <ellipse cx="100" cy="118" rx="50" ry="64" fill="#e7c7ae"/>
  <ellipse cx="82" cy="112" rx="4.5" ry="5.5" fill="#7c5b48"/>
  <ellipse cx="118" cy="112" rx="4.5" ry="5.5" fill="#7c5b48"/>
  <path d="M86,146 Q100,156 114,146" stroke="#b9836a" stroke-width="4" fill="none" stroke-linecap="round"/>`;

const el = (id) => document.getElementById(id);

const dom = {
  start: el("startView"),
  camera: el("cameraView"),
  studio: el("studioView"),
  fileInput: el("fileInput"),
  selfieBtn: el("selfieBtn"),
  uploadBtn: el("uploadBtn"),
  cameraFeed: el("cameraFeed"),
  shutter: el("shutterBtn"),
  cancelCamera: el("cancelCameraBtn"),
  cameraError: el("cameraError"),
  cameraErrorText: el("cameraErrorText"),
  cameraFallback: el("cameraFallbackBtn"),
  stage: el("stage"),
  photo: el("photo"),
  hairLayer: el("hairLayer"),
  fitStatus: el("fitStatus"),
  styleList: el("styleList"),
  colorList: el("colorList"),
  styleName: el("styleName"),
  colorName: el("colorName"),
  size: el("sizeRange"),
  lift: el("liftRange"),
  slide: el("slideRange"),
  rotate: el("rotateRange"),
  resetFit: el("resetFitBtn"),
  save: el("saveBtn"),
  retake: el("retakeBtn"),
  version: el("appVersion"),
  startArt: el("startArt"),
};

const state = {
  styleId: HAIRSTYLES[0].id,
  colorHex: HAIR_COLORS[0].hex,
  face: null,
  mirrored: false,
  adjust: { size: 1, lift: 0, slide: 0, rotate: 0 },
};

let cameraStream = null;

/* ---------- view switching ---------- */

function showView(name) {
  dom.start.hidden = name !== "start";
  dom.camera.hidden = name !== "camera";
  dom.studio.hidden = name !== "studio";
  if (name !== "start") dom.cameraError.hidden = true;
}

/* ---------- pickers ---------- */

function currentStyle() {
  return HAIRSTYLES.find((s) => s.id === state.styleId) || HAIRSTYLES[0];
}

function buildStylePicker() {
  dom.styleList.innerHTML = "";

  HAIRSTYLES.forEach((style) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rx-chip";
    btn.dataset.styleId = style.id;
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = `
      <span class="rx-chip-art">
        <svg viewBox="0 0 ${VIEW.w} ${VIEW.h}" aria-hidden="true">
          ${CHIP_FACE}${hairSvg(style, state.colorHex, `chip-${style.id}`)}
        </svg>
      </span>
      <span class="rx-chip-label"></span>`;
    btn.querySelector(".rx-chip-label").textContent = style.name;
    btn.addEventListener("click", () => {
      state.styleId = style.id;
      savePrefs();
      syncStyleSelection();
      renderHair();
    });
    dom.styleList.appendChild(btn);
  });

  syncStyleSelection();
}

function refreshChipColors() {
  dom.styleList.querySelectorAll("[data-style-id]").forEach((btn) => {
    const style = HAIRSTYLES.find((s) => s.id === btn.dataset.styleId);
    const svg = btn.querySelector("svg");
    if (!style || !svg) return;
    svg.innerHTML = CHIP_FACE + hairSvg(style, state.colorHex, `chip-${style.id}`);
  });
}

function syncStyleSelection() {
  dom.styleList.querySelectorAll("[data-style-id]").forEach((btn) => {
    const on = btn.dataset.styleId === state.styleId;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  dom.styleName.textContent = currentStyle().name;
}

function buildColorPicker() {
  dom.colorList.innerHTML = "";

  HAIR_COLORS.forEach((color) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rx-swatch";
    btn.dataset.hex = color.hex;
    btn.style.setProperty("--swatch", color.hex);
    btn.title = color.name;
    btn.setAttribute("aria-label", color.name);
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      state.colorHex = color.hex;
      savePrefs();
      syncColorSelection();
      refreshChipColors();
      renderHair();
    });
    dom.colorList.appendChild(btn);
  });

  syncColorSelection();
}

function syncColorSelection() {
  const match = HAIR_COLORS.find((c) => c.hex === state.colorHex) || HAIR_COLORS[0];
  dom.colorList.querySelectorAll("[data-hex]").forEach((btn) => {
    const on = btn.dataset.hex === match.hex;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  dom.colorName.textContent = match.name;
}

/* ---------- hair placement ---------- */

function hairTransform() {
  const face = state.face;
  if (!face) return null;

  const { size, lift, slide, rotate } = state.adjust;
  const scale = ((face.width * HEAD_SPAN_FUDGE) / HEAD_SPAN) * size;
  const cx = face.cx + slide * face.width;
  const cy = face.cy + lift * face.width;

  return `translate(${cx} ${cy}) rotate(${face.angle + rotate}) scale(${scale}) translate(${-ANCHOR.x} ${-ANCHOR.y})`;
}

function renderHair() {
  const img = dom.photo;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return;

  const transform = hairTransform();
  if (!transform) return;

  dom.hairLayer.setAttribute("viewBox", `0 0 ${w} ${h}`);
  dom.hairLayer.innerHTML = `<g transform="${transform}">${hairSvg(
    currentStyle(),
    state.colorHex,
    "stage",
  )}</g>`;
}

function resetAdjust() {
  state.adjust = { size: 1, lift: 0, slide: 0, rotate: 0 };
  dom.size.value = "1";
  dom.lift.value = "0";
  dom.slide.value = "0";
  dom.rotate.value = "0";
}

async function fitFaceToPhoto() {
  dom.fitStatus.hidden = false;
  dom.fitStatus.textContent = "Finding your face…";

  let face = null;
  try {
    face = await measureFace(dom.photo);
  } catch (err) {
    console.warn("[Roxanne AI] face detection unavailable:", err.message);
  }

  if (face) {
    dom.fitStatus.hidden = true;
  } else {
    face = guessFace(dom.photo);
    dom.fitStatus.hidden = false;
    dom.fitStatus.textContent = "Drag the hair to line it up";
  }

  state.face = face;
  renderHair();
}

/* ---------- photo input ---------- */

function loadPhoto(src, mirrored) {
  return new Promise((resolve, reject) => {
    const img = dom.photo;
    img.onload = () => {
      dom.stage.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
      resolve();
    };
    img.onerror = () => reject(new Error("Could not load that image"));
    state.mirrored = Boolean(mirrored);
    img.src = src;
  });
}

async function usePhoto(src, mirrored) {
  await loadPhoto(src, mirrored);
  showView("studio");
  resetAdjust();
  await fitFaceToPhoto();
}

function handleFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => usePhoto(String(reader.result), false);
  reader.readAsDataURL(file);
}

/* ---------- camera ---------- */

const CAMERA_MESSAGES = {
  NotAllowedError:
    "Camera access is blocked for this site. Allow it in your browser settings, or use your camera app instead.",
  SecurityError:
    "Camera access is blocked for this site. Allow it in your browser settings, or use your camera app instead.",
  NotFoundError: "No camera found on this device. Use your camera app or upload a photo.",
  NotReadableError:
    "Another app is using the camera. Close it and try again, or use your camera app.",
};

/** In-page preview needs both the API and a secure origin (https or localhost). */
function canPreviewCamera() {
  return Boolean(window.isSecureContext && navigator.mediaDevices?.getUserMedia);
}

/** Hand off to the phone's own camera through the file input. */
function openCameraApp() {
  dom.fileInput.setAttribute("capture", "user");
  dom.fileInput.click();
}

function showCameraError(err) {
  dom.cameraErrorText.textContent =
    CAMERA_MESSAGES[err?.name] ||
    "We couldn't open the camera here. Use your camera app or upload a photo.";
  dom.cameraError.hidden = false;
}

async function openCamera() {
  dom.cameraError.hidden = true;

  // No in-page preview available, so go straight to the camera app. This has to
  // happen in the same tick as the tap: a file input opened after an await has
  // lost its user activation and browsers will ignore the click.
  if (!canPreviewCamera()) {
    openCameraApp();
    return;
  }

  dom.selfieBtn.disabled = true;
  dom.selfieBtn.textContent = "Opening camera…";

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
      audio: false,
    });
    dom.cameraFeed.srcObject = cameraStream;
    showView("camera");
    await dom.cameraFeed.play().catch(() => {});
  } catch (err) {
    console.warn("[Roxanne AI] camera unavailable:", err.name, err.message);
    showCameraError(err);
  } finally {
    dom.selfieBtn.disabled = false;
    dom.selfieBtn.textContent = "Take a selfie";
  }
}

function stopCamera() {
  dom.shutter.disabled = true;
  if (!cameraStream) return;
  cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  dom.cameraFeed.srcObject = null;
}

function captureFrame() {
  const video = dom.cameraFeed;
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  // The preview is mirrored like a real mirror, so flip the capture to match.
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);

  stopCamera();
  usePhoto(canvas.toDataURL("image/jpeg", 0.92), true);
}

/* ---------- save ---------- */

function svgToImage(markup) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not render the hairstyle"));
    };
    img.src = url;
  });
}

async function saveLook() {
  const photo = dom.photo;
  const w = photo.naturalWidth;
  const h = photo.naturalHeight;
  if (!w || !h) return;

  dom.save.disabled = true;
  const original = dom.save.textContent;
  dom.save.textContent = "Saving…";

  try {
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g transform="${hairTransform()}">${hairSvg(
      currentStyle(),
      state.colorHex,
      "save",
    )}</g></svg>`;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(photo, 0, 0, w, h);
    ctx.drawImage(await svgToImage(markup), 0, 0, w, h);

    const link = document.createElement("a");
    link.download = `roxanne-ai-${currentStyle().id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (err) {
    console.warn("[Roxanne AI] save failed:", err.message);
    dom.fitStatus.hidden = false;
    dom.fitStatus.textContent = "Could not save that look";
  } finally {
    dom.save.disabled = false;
    dom.save.textContent = original;
  }
}

/* ---------- drag to reposition ---------- */

function bindDrag() {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startSlide = 0;
  let startLift = 0;

  const begin = (e) => {
    if (!state.face) return;
    dragging = true;
    const point = e.touches ? e.touches[0] : e;
    startX = point.clientX;
    startY = point.clientY;
    startSlide = state.adjust.slide;
    startLift = state.adjust.lift;
    dom.stage.classList.add("is-dragging");
  };

  const move = (e) => {
    if (!dragging) return;
    const point = e.touches ? e.touches[0] : e;
    const rect = dom.stage.getBoundingClientRect();
    const perPixel = dom.photo.naturalWidth / rect.width / state.face.width;
    state.adjust.slide = startSlide + (point.clientX - startX) * perPixel;
    state.adjust.lift = startLift + (point.clientY - startY) * perPixel;
    dom.slide.value = String(state.adjust.slide);
    dom.lift.value = String(state.adjust.lift);
    renderHair();
    if (e.cancelable) e.preventDefault();
  };

  const end = () => {
    dragging = false;
    dom.stage.classList.remove("is-dragging");
  };

  dom.stage.addEventListener("mousedown", begin);
  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);
  dom.stage.addEventListener("touchstart", begin, { passive: true });
  dom.stage.addEventListener("touchmove", move, { passive: false });
  dom.stage.addEventListener("touchend", end);
}

/* ---------- prefs ---------- */

function savePrefs() {
  localStorage.setItem(
    PREFS_KEY,
    JSON.stringify({ styleId: state.styleId, colorHex: state.colorHex }),
  );
}

function loadPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
    if (saved?.styleId && HAIRSTYLES.some((s) => s.id === saved.styleId)) {
      state.styleId = saved.styleId;
    }
    if (saved?.colorHex && HAIR_COLORS.some((c) => c.hex === saved.colorHex)) {
      state.colorHex = saved.colorHex;
    }
  } catch {
    /* first run */
  }
}

/* ---------- wiring ---------- */

function bindAdjust() {
  const bind = (input, key) => {
    input.addEventListener("input", () => {
      state.adjust[key] = Number(input.value);
      renderHair();
    });
  };
  bind(dom.size, "size");
  bind(dom.lift, "lift");
  bind(dom.slide, "slide");
  bind(dom.rotate, "rotate");

  dom.resetFit.addEventListener("click", () => {
    resetAdjust();
    renderHair();
  });
}

function init() {
  dom.version.textContent = roxanneAIVersionLabel();

  loadPrefs();

  if (dom.startArt) {
    const preview = HAIRSTYLES.find((s) => s.id === "curls") || HAIRSTYLES[0];
    dom.startArt.innerHTML = CHIP_FACE + hairSvg(preview, "#b0225a", "start");
  }

  buildColorPicker();
  buildStylePicker();
  bindAdjust();
  bindDrag();

  dom.selfieBtn.addEventListener("click", openCamera);
  dom.cameraFallback.addEventListener("click", openCameraApp);
  dom.uploadBtn.addEventListener("click", () => {
    dom.fileInput.removeAttribute("capture");
    dom.fileInput.click();
  });

  // Only allow a capture once the stream is actually producing frames.
  dom.cameraFeed.addEventListener("loadedmetadata", () => {
    dom.shutter.disabled = !dom.cameraFeed.videoWidth;
  });
  dom.fileInput.addEventListener("change", (e) => {
    handleFile(e.target.files[0]);
    e.target.value = "";
  });

  dom.shutter.addEventListener("click", captureFrame);
  dom.cancelCamera.addEventListener("click", () => {
    stopCamera();
    showView("start");
  });

  dom.save.addEventListener("click", saveLook);
  dom.retake.addEventListener("click", () => {
    showView("start");
  });

  window.addEventListener("resize", renderHair);
}

init();

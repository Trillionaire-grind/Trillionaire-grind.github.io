const GEMINI_MODEL = "gemini-3.8-flash";
const KEY_STORAGE = "dogdetector_gemini_api_key";
const BREED_SCHEMA = {
  type: "object",
  properties: {
    found: { type: "boolean" },
    breed: { type: "string" },
    confidence: { type: "integer" },
    note: { type: "string" },
    alternatives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          breed: { type: "string" },
          confidence: { type: "integer" },
        },
        required: ["breed"],
      },
    },
  },
  required: ["found", "breed", "confidence", "note"],
};

const state = {
  baseImage: null,
  detecting: false,
};

let stream = null;

const captureSection = document.getElementById("captureSection");
const editorSection = document.getElementById("editorSection");
const resultSection = document.getElementById("resultSection");
const detectRow = document.getElementById("detectRow");
const resultRow = document.getElementById("resultRow");
const video = document.getElementById("video");
const snapRow = document.getElementById("snapRow");
const photoImg = document.getElementById("photoImg");
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");
const statusBadge = document.getElementById("statusBadge");
const errorBox = document.getElementById("errorBox");
const breedCard = document.getElementById("breedCard");
const keyModal = document.getElementById("keyModal");
const apiKeyInput = document.getElementById("apiKeyInput");

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = "block";
}

function clearError() {
  errorBox.style.display = "none";
  errorBox.textContent = "";
}

function resizeImage(img, maxDim) {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  return { base64: dataUrl.split(",")[1], mimeType: "image/jpeg", dataUrl };
}

function loadImageFromSrc(src) {
  const img = new Image();
  img.onload = () => {
    const resized = resizeImage(img, 1024);
    state.baseImage = resized;
    photoImg.src = resized.dataUrl;
    showEditor();
    clearError();
    statusBadge.textContent = "";
    breedCard.innerHTML = "";
    resultSection.classList.add("hidden");
  };
  img.src = src;
}

function showEditor() {
  captureSection.classList.add("hidden");
  editorSection.classList.remove("hidden");
  detectRow.classList.remove("hidden");
  resultRow.classList.add("hidden");
}

document.getElementById("uploadBtn").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => loadImageFromSrc(reader.result);
  reader.readAsDataURL(file);
});

document.getElementById("cameraBtn").addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
    });
    video.srcObject = stream;
    video.classList.remove("hidden");
    snapRow.style.display = "flex";
  } catch (err) {
    alert("Could not open the camera. Upload a photo instead.");
  }
});

document.getElementById("cancelCameraBtn").addEventListener("click", stopCamera);

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  video.classList.add("hidden");
  snapRow.style.display = "none";
}

document.getElementById("snapBtn").addEventListener("click", () => {
  const tmp = document.createElement("canvas");
  tmp.width = video.videoWidth;
  tmp.height = video.videoHeight;
  tmp.getContext("2d").drawImage(video, 0, 0);
  const dataUrl = tmp.toDataURL("image/png");
  stopCamera();
  loadImageFromSrc(dataUrl);
});

function getApiKey() {
  return localStorage.getItem(KEY_STORAGE) || "";
}

function setApiKey(key) {
  localStorage.setItem(KEY_STORAGE, key);
}

function askForApiKey() {
  return new Promise((resolve) => {
    apiKeyInput.value = getApiKey();
    keyModal.classList.remove("hidden");
    apiKeyInput.focus();

    function cleanup() {
      keyModal.classList.add("hidden");
      saveBtn.removeEventListener("click", onSave);
      cancelBtn.removeEventListener("click", onCancel);
    }

    function onSave() {
      const val = apiKeyInput.value.trim();
      if (!val) return;
      setApiKey(val);
      cleanup();
      resolve(val);
    }

    function onCancel() {
      cleanup();
      resolve(null);
    }

    const saveBtn = document.getElementById("saveKeyBtn");
    const cancelBtn = document.getElementById("cancelKeyBtn");
    saveBtn.addEventListener("click", onSave);
    cancelBtn.addEventListener("click", onCancel);
  });
}

function parseModelJson(text) {
  const raw = String(text || "").trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The model did not return a breed result.");
  return JSON.parse(body.slice(start, end + 1));
}

function extractInteractionText(json) {
  if (typeof json?.output_text === "string" && json.output_text.trim()) {
    return json.output_text;
  }
  const chunks = [];
  const steps = Array.isArray(json?.steps) ? json.steps : [];
  for (const step of steps) {
    if (step?.type !== "model_output") continue;
    const content = Array.isArray(step.content) ? step.content : [];
    for (const part of content) {
      if (part?.type === "text" && part.text) chunks.push(part.text);
    }
  }
  const outputs = Array.isArray(json?.outputs) ? json.outputs : [];
  for (const part of outputs) {
    if (part?.type === "text" && part.text) chunks.push(part.text);
  }
  return chunks.join("\n");
}

async function detectBreed(apiKey) {
  const prompt =
    "Look at this photo. If a dog is clearly in the picture, name the most likely breed. " +
    "If no dog is in the picture, say so. " +
    "Use found=false, breed=\"\", confidence=0 when there is no dog. Keep note to one short sentence.";

  const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      input: [
        { type: "text", text: prompt },
        {
          type: "image",
          mime_type: state.baseImage.mimeType,
          data: state.baseImage.base64,
        },
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: BREED_SCHEMA,
      },
    }),
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = (json && json.error && json.error.message) || `Request failed (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  const text = extractInteractionText(json);
  return parseModelJson(text);
}

function renderResult(result) {
  if (!result || result.found === false) {
    breedCard.innerHTML =
      "<h3>No dog found</h3>" +
      '<p class="confidence">Try a closer photo of the face and body.</p>' +
      "<p>" + escapeHtml(result && result.note ? result.note : "This picture does not look like a dog.") + "</p>";
    return;
  }

  const confidence = Math.max(0, Math.min(100, Number(result.confidence) || 0));
  const alts = Array.isArray(result.alternatives) ? result.alternatives.slice(0, 3) : [];
  breedCard.innerHTML =
    "<h3>" + escapeHtml(result.breed || "Unknown breed") + "</h3>" +
    '<p class="confidence">' + confidence + "% match</p>" +
    "<p>" + escapeHtml(result.note || "This is the closest breed from the photo.") + "</p>" +
    (alts.length
      ? '<div class="alt-list">' +
        alts.map((alt) => {
          const name = escapeHtml(alt.breed || "Other");
          const score = Math.max(0, Math.min(100, Number(alt.confidence) || 0));
          return '<span class="alt-chip">' + name + (score ? " · " + score + "%" : "") + "</span>";
        }).join("") +
        "</div>"
      : "");
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function runDetect() {
  if (state.detecting || !state.baseImage) return;
  clearError();

  let apiKey = getApiKey();
  if (!apiKey) {
    apiKey = await askForApiKey();
    if (!apiKey) return;
  }

  state.detecting = true;
  loadingOverlay.classList.remove("hidden");
  loadingText.textContent = "Reading the breed…";
  document.getElementById("detectBtn").disabled = true;
  document.getElementById("detectAgainBtn").disabled = true;
  statusBadge.textContent = "";

  try {
    const result = await detectBreed(apiKey);
    renderResult(result);
    detectRow.classList.add("hidden");
    resultSection.classList.remove("hidden");
    resultRow.classList.remove("hidden");
    statusBadge.textContent = result.found === false
      ? "No breed to name from this photo."
      : "Breed read complete. Take another photo anytime.";
  } catch (err) {
    let msg = err.message || String(err);
    if (/API key not valid|API_KEY_INVALID|401|403/i.test(msg)) {
      msg += ". Your key may be invalid or missing vision access.";
      localStorage.removeItem(KEY_STORAGE);
    }
    showError(msg);
  } finally {
    state.detecting = false;
    loadingOverlay.classList.add("hidden");
    document.getElementById("detectBtn").disabled = false;
    document.getElementById("detectAgainBtn").disabled = false;
  }
}

document.getElementById("detectBtn").addEventListener("click", runDetect);
document.getElementById("detectAgainBtn").addEventListener("click", runDetect);
document.getElementById("cancelDetectBtn").addEventListener("click", startOver);
document.getElementById("retakeBtn").addEventListener("click", startOver);

function startOver() {
  stopCamera();
  state.baseImage = null;
  photoImg.src = "";
  breedCard.innerHTML = "";
  captureSection.classList.remove("hidden");
  editorSection.classList.add("hidden");
  resultSection.classList.add("hidden");
  detectRow.classList.add("hidden");
  resultRow.classList.add("hidden");
  clearError();
  statusBadge.textContent = "";
  document.getElementById("fileInput").value = "";
}

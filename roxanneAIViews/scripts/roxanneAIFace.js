/**
 * Finds the face in a photo so a hairstyle can be placed on it automatically.
 *
 * Uses MediaPipe's short-range face detector (~230KB) loaded on demand. If the
 * model or network is unavailable the app still works: callers fall back to a
 * centered guess that the user can nudge by hand.
 */

const VISION_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const LOAD_TIMEOUT_MS = 15000;

let detectorPromise = null;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), ms),
    ),
  ]);
}

async function createDetector() {
  const vision = await import(/* @vite-ignore */ `${VISION_CDN}/vision_bundle.mjs`);
  const fileset = await vision.FilesetResolver.forVisionTasks(`${VISION_CDN}/wasm`);

  for (const delegate of ["GPU", "CPU"]) {
    try {
      return await vision.FaceDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: "IMAGE",
        minDetectionConfidence: 0.4,
      });
    } catch (err) {
      if (delegate === "CPU") throw err;
    }
  }
  return null;
}

function loadDetector() {
  if (!detectorPromise) {
    detectorPromise = withTimeout(createDetector(), LOAD_TIMEOUT_MS, "Face model").catch(
      (err) => {
        detectorPromise = null;
        throw err;
      },
    );
  }
  return detectorPromise;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Measure the head in an image.
 * Returns pixel-space { cx, cy, width, angle } where cx/cy sit at ear level,
 * width spans the head, and angle is head roll in degrees. Null when no face.
 */
export async function measureFace(imageEl) {
  const detector = await loadDetector();
  if (!detector) return null;

  const result = detector.detect(imageEl);
  const detection = (result?.detections || [])[0];
  if (!detection) return null;

  const w = imageEl.naturalWidth || imageEl.width;
  const h = imageEl.naturalHeight || imageEl.height;
  const box = detection.boundingBox;
  const points = (detection.keypoints || []).map((k) => ({ x: k.x * w, y: k.y * h }));

  // Keypoints are [eye, eye, nose, mouth, tragion, tragion]; sort by x so the
  // pairs work the same whether the subject faces the camera or is mirrored.
  const eyes = points.slice(0, 2).sort((a, b) => a.x - b.x);
  const tragions = points.slice(4, 6).sort((a, b) => a.x - b.x);

  if (tragions.length === 2 && distance(tragions[0], tragions[1]) > 8) {
    const [left, right] = tragions;
    return {
      cx: (left.x + right.x) / 2,
      cy: (left.y + right.y) / 2,
      width: distance(left, right),
      angle: (Math.atan2(right.y - left.y, right.x - left.x) * 180) / Math.PI,
      source: "landmarks",
    };
  }

  if (!box) return null;

  const angle =
    eyes.length === 2
      ? (Math.atan2(eyes[1].y - eyes[0].y, eyes[1].x - eyes[0].x) * 180) / Math.PI
      : 0;

  return {
    cx: box.originX + box.width / 2,
    cy: box.originY + box.height * 0.42,
    width: box.width,
    angle,
    source: "box",
  };
}

/** Centered guess used when detection is unavailable. */
export function guessFace(imageEl) {
  const w = imageEl.naturalWidth || imageEl.width;
  const h = imageEl.naturalHeight || imageEl.height;
  return {
    cx: w / 2,
    cy: h * 0.42,
    width: Math.min(w, h) * 0.42,
    angle: 0,
    source: "guess",
  };
}

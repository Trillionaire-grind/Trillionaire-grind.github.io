/** Bump this on each Dog Detector release (GitHub Pages). */
export const DOG_DETECTOR_APP_VERSION = "0.0.0.2";

export function dogDetectorVersionLabel() {
  return "v" + DOG_DETECTOR_APP_VERSION;
}

console.log("[Dog Detector] working version:", dogDetectorVersionLabel());

const label = document.getElementById("appVersion");
if (label) label.textContent = dogDetectorVersionLabel();

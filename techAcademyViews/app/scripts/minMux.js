import {
  getMuxUploadApiUrl,
  getMuxUploadStatusApiUrl,
  isMinMuxConfigured,
} from "./minFirebaseConfig.js";

async function authHeaders() {
  const user = window.MIN_AUTH && window.MIN_AUTH.getCurrentUser();
  if (!user) throw new Error("Sign in to upload video.");
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body || {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Mux request failed.");
  }
  return payload;
}

export function isMuxUploadAvailable() {
  return isMinMuxConfigured();
}

export async function createDirectUpload(title) {
  const url = getMuxUploadApiUrl();
  if (!url) throw new Error("Mux upload is not configured yet.");
  return postJson(url, { title: title || "Tech Academy upload" });
}

export function uploadVideoFile(file, uploadUrl, onProgress) {
  return new Promise((resolve, reject) => {
    if (!file || !uploadUrl) {
      reject(new Error("Missing video file or upload URL."));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === "function") {
        onProgress(event.loaded, event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error("Video upload failed. Try again."));
    };

    xhr.onerror = () => reject(new Error("Video upload failed. Check your connection."));
    xhr.send(file);
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForMuxUploadReady(uploadId, options) {
  const statusUrl = getMuxUploadStatusApiUrl();
  if (!statusUrl) throw new Error("Mux status check is not configured yet.");

  const timeoutMs = (options && options.timeoutMs) || 15 * 60 * 1000;
  const intervalMs = (options && options.intervalMs) || 3000;
  const onStatus = options && options.onStatus;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const status = await postJson(statusUrl, { uploadId });
    if (typeof onStatus === "function") {
      onStatus(status);
    }
    if (status.ready && status.playbackId) {
      return status;
    }
    if (status.uploadStatus === "errored" || status.uploadStatus === "cancelled") {
      throw new Error("Video processing failed. Try uploading again.");
    }
    await wait(intervalMs);
  }

  throw new Error("Video is still processing. Try again in a few minutes.");
}

export async function uploadVideoForPost(file, title, onProgress) {
  if (!isMuxUploadAvailable()) {
    throw new Error("Mux is not configured yet.");
  }
  if (!file) throw new Error("Choose a video file.");
  if (!String(file.type || "").startsWith("video/")) {
    throw new Error("Choose a valid video file.");
  }

  const created = await createDirectUpload(title);
  if (typeof onProgress === "function") {
    onProgress(0, file.size, "uploading");
  }
  await uploadVideoFile(file, created.uploadUrl, (loaded, total) => {
    if (typeof onProgress === "function") {
      onProgress(loaded, total, "uploading");
    }
  });

  if (typeof onProgress === "function") {
    onProgress(file.size, file.size, "processing");
  }

  const ready = await waitForMuxUploadReady(created.uploadId, {
    onStatus: (status) => {
      if (typeof onProgress === "function") {
        onProgress(file.size, file.size, status.ready ? "ready" : "processing");
      }
    },
  });

  return {
    muxUploadId: created.uploadId,
    muxAssetId: ready.assetId,
    muxPlaybackId: ready.playbackId,
    videoStatus: "ready",
    videoProvider: "mux",
  };
}

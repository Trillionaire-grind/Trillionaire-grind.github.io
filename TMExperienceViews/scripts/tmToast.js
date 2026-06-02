const DEFAULT_DURATION_MS = 4200;

function getOrCreateStack() {
  let stack = document.getElementById("tmToastStack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "tmToastStack";
    stack.className = "tm-toast-stack";
    stack.setAttribute("aria-live", "polite");
    stack.setAttribute("aria-relevant", "additions");
    document.body.appendChild(stack);
  }
  return stack;
}

function dismissToast(toastEl) {
  if (!toastEl?.isConnected) return;
  toastEl.classList.remove("is-visible");
  toastEl.classList.add("is-leaving");
  window.setTimeout(() => toastEl.remove(), 320);
}

/**
 * Show an in-app toast. In iframes, posts to the parent shell so toasts sit above the tab bar.
 * @param {string} message
 * @param {{ type?: 'info'|'success'|'error', duration?: number }} [options]
 */
export function showTmToast(message, { type = "info", duration = DEFAULT_DURATION_MS } = {}) {
  const text = String(message || "").trim();
  if (!text) return;

  if (window.parent !== window) {
    window.parent.postMessage(
      { type: "tm-toast", message: text, variant: type, duration },
      "*"
    );
    return;
  }

  const stack = getOrCreateStack();
  const toast = document.createElement("div");
  toast.className = `tm-toast tm-toast--${type}`;
  toast.setAttribute("role", "status");

  const textEl = document.createElement("p");
  textEl.className = "tm-toast__text";
  textEl.textContent = text;
  toast.appendChild(textEl);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "tm-toast__close";
  closeBtn.setAttribute("aria-label", "Dismiss");
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", () => dismissToast(toast));
  toast.appendChild(closeBtn);

  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));

  if (duration > 0) {
    window.setTimeout(() => dismissToast(toast), duration);
  }
}

let relayReady = false;

/** Listen for toast requests from child iframes (call once on TMExperience shell). */
export function initTmToastRelay() {
  if (relayReady || window.parent !== window) return;
  relayReady = true;
  window.addEventListener("message", (event) => {
    if (event.data?.type !== "tm-toast") return;
    showTmToast(event.data.message, {
      type: event.data.variant || "info",
      duration: event.data.duration ?? DEFAULT_DURATION_MS,
    });
  });
}

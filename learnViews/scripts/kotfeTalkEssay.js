const STORAGE_KEY = "mangeLakayEssayTalk";

function speechEngine() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function loadDraft() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch (_) {
    return "";
  }
}

function saveDraft(text) {
  try {
    localStorage.setItem(STORAGE_KEY, text);
  } catch (_) {
    /* ignore */
  }
}

export function initKotfeTalkEssay(root) {
  if (!root) return;

  const Engine = speechEngine();
  let recognition = null;
  let listening = false;
  let finalText = loadDraft();

  root.innerHTML = `
    <p class="kotfe-talk-lead">
      Talk the Mangé Lakay VSL out loud. This page writes the transcript.
      When you are done, copy it and send it so the essay on Mangé Lakay can be the letter you spoke.
    </p>
    <div class="kotfe-talk-toolbar">
      <label class="kotfe-talk-lang">
        Language
        <select id="kotfeTalkLang">
          <option value="en-US">English</option>
          <option value="ht-HT">Kreyòl</option>
          <option value="fr-FR">Français</option>
        </select>
      </label>
      <button type="button" class="btn-donate" id="kotfeTalkToggle">Start talking</button>
      <button type="button" class="kotfe-talk-ghost" id="kotfeTalkCopy">Copy transcript</button>
      <button type="button" class="kotfe-talk-ghost" id="kotfeTalkClear">Clear</button>
    </div>
    <p class="kotfe-talk-status" id="kotfeTalkStatus" aria-live="polite"></p>
    <textarea id="kotfeTalkText" class="kotfe-talk-text" rows="18" placeholder="Your words land here. Pause, then keep talking. Edit anything you want."></textarea>
    <p class="kotfe-talk-hint" id="kotfeTalkHint"></p>
  `;

  const toggle = root.querySelector("#kotfeTalkToggle");
  const copyBtn = root.querySelector("#kotfeTalkCopy");
  const clearBtn = root.querySelector("#kotfeTalkClear");
  const lang = root.querySelector("#kotfeTalkLang");
  const status = root.querySelector("#kotfeTalkStatus");
  const area = root.querySelector("#kotfeTalkText");
  const hint = root.querySelector("#kotfeTalkHint");

  area.value = finalText;

  if (!Engine) {
    status.textContent = "This browser cannot hear you. Use Chrome on a computer, or talk in the next Cursor message and I will write the essay.";
    toggle.disabled = true;
    hint.textContent = "No live mic here. Type, or send the talk as a message.";
    area.addEventListener("input", () => saveDraft(area.value));
    return;
  }

  function setListening(on) {
    listening = on;
    toggle.textContent = on ? "Stop talking" : "Start talking";
    status.textContent = on ? "Listening. Speak the letter." : "Stopped. You can start again. It will add on.";
  }

  function appendFinal(piece) {
    const bit = String(piece || "").trim();
    if (!bit) return;
    const base = area.value.trim();
    finalText = base ? `${base} ${bit}` : bit;
    area.value = finalText;
    saveDraft(finalText);
  }

  function start() {
    recognition = new Engine();
    recognition.lang = lang.value || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) appendFinal(result[0].transcript);
        else interim += result[0].transcript;
      }
      if (interim) status.textContent = interim;
    };

    recognition.onerror = (event) => {
      status.textContent = event.error === "not-allowed"
        ? "The mic is blocked. Allow the microphone, then start again."
        : `Mic stopped: ${event.error}. Start again when you are ready.`;
      setListening(false);
    };

    recognition.onend = () => {
      if (listening) {
        try {
          recognition.start();
        } catch (_) {
          setListening(false);
        }
      }
    };

    try {
      recognition.start();
      setListening(true);
    } catch (err) {
      status.textContent = "Could not start the mic. Try Chrome, or type the talk here.";
      setListening(false);
    }
  }

  function stop() {
    listening = false;
    try {
      recognition?.stop();
    } catch (_) {
      /* ignore */
    }
    setListening(false);
  }

  toggle.addEventListener("click", () => {
    if (listening) stop();
    else start();
  });

  copyBtn.addEventListener("click", async () => {
    const text = area.value.trim();
    if (!text) {
      status.textContent = "Nothing to copy yet.";
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Copied. Send this transcript and I will set it as the Mangé Lakay essay.";
    } catch (_) {
      area.select();
      status.textContent = "Copy failed. Select the text and copy it yourself.";
    }
  });

  clearBtn.addEventListener("click", () => {
    if (!window.confirm("Clear the transcript on this device?")) return;
    finalText = "";
    area.value = "";
    saveDraft("");
    status.textContent = "Cleared.";
  });

  area.addEventListener("input", () => {
    finalText = area.value;
    saveDraft(finalText);
  });

  hint.textContent = "Works best in Chrome. Talk in short stretches. Edit the text as you go.";
}

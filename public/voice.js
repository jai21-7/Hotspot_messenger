// Phase 8 — voice messages: record short audio clips and send in chat
(function () {
  const voiceBtn = document.getElementById("voice-btn");
  const voiceStatus = document.getElementById("voice-status");

  let mediaRecorder = null;
  let chunks = [];
  let recording = false;
  let maxTimer = null;

  function setStatus(text, isRecording) {
    if (voiceStatus) {
      voiceStatus.textContent = text || "";
      voiceStatus.hidden = !text;
      voiceStatus.classList.toggle("voice-status--active", Boolean(isRecording));
    }
    if (voiceBtn) {
      voiceBtn.classList.toggle("recording", Boolean(isRecording));
      voiceBtn.setAttribute("aria-pressed", isRecording ? "true" : "false");
    }
  }

  function pickMimeType() {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  }

  async function startRecording() {
    if (recording || !voiceBtn || voiceBtn.disabled) {
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Voice messages need microphone access. Try on a phone or allow the mic in browser settings.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      chunks = [];
      mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorder.ondataavailable = function (event) {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = function () {
        stream.getTracks().forEach(function (track) {
          track.stop();
        });
        const type = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type });
        const ext = type.includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], "voice-" + Date.now() + "." + ext, { type });
        if (typeof window.HMSetPendingAttachment === "function") {
          window.HMSetPendingAttachment(file);
        }
        setStatus("Voice ready — tap Send");
        recording = false;
        if (typeof window.HMHaptic === "function") {
          window.HMHaptic();
        }
      };

      mediaRecorder.start();
      recording = true;
      setStatus("Recording… tap again to stop", true);
      if (typeof window.HMHaptic === "function") {
        window.HMHaptic();
      }

      maxTimer = window.setTimeout(function () {
        stopRecording();
      }, 60000);
    } catch (error) {
      alert("Microphone permission denied or not available.");
      setStatus("");
    }
  }

  function stopRecording() {
    if (maxTimer) {
      window.clearTimeout(maxTimer);
      maxTimer = null;
    }
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setStatus("Processing voice…");
    }
  }

  function toggleRecording() {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  if (voiceBtn) {
    voiceBtn.addEventListener("click", toggleRecording);
  }

  window.HMVoice = {
    setEnabled: function (enabled) {
      if (voiceBtn) {
        voiceBtn.disabled = !enabled;
      }
    },
    cancel: function () {
      if (recording) {
        stopRecording();
      }
      setStatus("");
    },
  };
})();

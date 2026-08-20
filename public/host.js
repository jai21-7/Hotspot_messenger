// Phase 6 — host on phone: in-app guide and host status panel
(function () {
  const hostPanel = document.getElementById("host-mode-panel");
  const hostStatusEl = document.getElementById("host-status-text");
  const hostUrlsEl = document.getElementById("host-urls-list");
  const hostTipsEl = document.getElementById("host-tips-list");
  const hostQrImg = document.getElementById("host-qr");
  const openHostGuideBtn = document.getElementById("open-host-guide-btn");
  const hostGuidePanel = document.getElementById("host-guide-panel");
  const copyTermuxSetupBtn = document.getElementById("copy-termux-setup-btn");
  const copyTermuxStartBtn = document.getElementById("copy-termux-start-btn");

  const TERMUX_SETUP_CMD = "pkg install -y nodejs git && git clone https://github.com/jai21-7/Hotspot_messenger.git && cd Hotspot_messenger && bash scripts/termux-setup.sh";
  const TERMUX_START_CMD = "cd Hotspot_messenger && npm start";

  function isRunningAsHost() {
    return !HMConnection.isNativeApp();
  }

  async function copyText(text, button, resetLabel) {
    try {
      await navigator.clipboard.writeText(text);
      if (button) {
        const original = button.textContent;
        button.textContent = "Copied!";
        window.setTimeout(function () {
          button.textContent = resetLabel || original;
        }, 2000);
      }
    } catch (error) {
      prompt("Copy this command:", text);
    }
  }

  function renderHostUrls(urls) {
    if (!hostUrlsEl) {
      return;
    }
    hostUrlsEl.innerHTML = "";
    if (!urls || urls.length === 0) {
      hostUrlsEl.innerHTML = "<li>Connect to Wi‑Fi or hotspot, then restart the server.</li>";
      return;
    }
    for (const url of urls) {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = url;
      link.textContent = url;
      link.target = "_blank";
      link.rel = "noopener";
      li.appendChild(link);

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "mini-btn host-copy-btn";
      copyBtn.textContent = "Copy";
      copyBtn.addEventListener("click", function () {
        copyText(url, copyBtn, "Copy");
      });
      li.appendChild(copyBtn);
      hostUrlsEl.appendChild(li);
    }
  }

  function renderHostTips(tips) {
    if (!hostTipsEl) {
      return;
    }
    hostTipsEl.innerHTML = "";
    for (const tip of tips || []) {
      const li = document.createElement("li");
      li.textContent = tip;
      hostTipsEl.appendChild(li);
    }
  }

  function updateHostQr(url) {
    if (!hostQrImg) {
      return;
    }
    if (!url) {
      hostQrImg.hidden = true;
      hostQrImg.removeAttribute("src");
      return;
    }
    hostQrImg.src = HMConnection.apiUrl("/api/qr?url=" + encodeURIComponent(url));
    hostQrImg.hidden = false;
  }

  async function loadHostInfo() {
    if (!isRunningAsHost() || !hostPanel) {
      return;
    }

    try {
      const response = await fetch(HMConnection.apiUrl("/api/host-info"));
      const data = await response.json();

      if (hostStatusEl) {
        const label = data.isTermux ? "Hosting on Termux" : "Hosting on this device";
        hostStatusEl.textContent = label;
      }

      renderHostUrls(data.urls);
      renderHostTips(data.tips);
      updateHostQr(data.urls && data.urls[0] ? data.urls[0] : null);
      hostPanel.hidden = false;
    } catch (error) {
      if (hostStatusEl) {
        hostStatusEl.textContent = "Could not load host info.";
      }
    }
  }

  function toggleHostGuide() {
    if (!hostGuidePanel) {
      return;
    }
    hostGuidePanel.hidden = !hostGuidePanel.hidden;
    if (!hostGuidePanel.hidden && typeof window.HMSwitchTab === "function") {
      window.HMSwitchTab("settings");
    }
  }

  function initHostGuide() {
    if (openHostGuideBtn) {
      openHostGuideBtn.addEventListener("click", toggleHostGuide);
    }
    if (copyTermuxSetupBtn) {
      copyTermuxSetupBtn.addEventListener("click", function () {
        copyText(TERMUX_SETUP_CMD, copyTermuxSetupBtn, "Copy setup command");
      });
    }
    if (copyTermuxStartBtn) {
      copyTermuxStartBtn.addEventListener("click", function () {
        copyText(TERMUX_START_CMD, copyTermuxStartBtn, "Copy start command");
      });
    }

    if (HMConnection.isNativeApp() && hostGuidePanel) {
      hostGuidePanel.hidden = false;
    }

    if (isRunningAsHost()) {
      loadHostInfo();
    }
  }

  document.addEventListener("DOMContentLoaded", initHostGuide);

  window.HMLoadHostInfo = loadHostInfo;
})();

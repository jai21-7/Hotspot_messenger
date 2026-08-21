// Phase 3 — mobile UX: connection banner, bottom nav, pull-to-refresh, image lightbox
(function () {
  const statusEl = document.getElementById("connection-status");
  const statusTextEl = document.getElementById("connection-status-text");
  const liveBadgeEl = document.getElementById("live-badge");
  const bottomNav = document.getElementById("bottom-nav");
  const dmNavBadge = document.getElementById("dm-nav-badge");
  const pullHint = document.getElementById("pull-refresh-hint");
  const changeServerBtn = document.getElementById("change-server-btn");
  const tabPanels = {
    rooms: document.getElementById("tab-rooms"),
    dms: document.getElementById("tab-dms"),
    settings: document.getElementById("tab-settings"),
  };
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImg = document.getElementById("image-lightbox-img");
  const messagesEl = document.getElementById("messages");
  const messageInput = document.getElementById("message-input");
  const copyServerBtn = document.getElementById("copy-server-btn");
  const shareServerBtn = document.getElementById("share-server-btn");
  const serverUrlDisplay = document.getElementById("server-url-display");
  const appSplash = document.getElementById("app-splash");
  const joinUrlCard = document.getElementById("join-url-card");
  const onboardingStepName = document.getElementById("onboarding-step-name");
  const settingsProfile = document.getElementById("settings-profile");
  const settingsProfileDisplay = document.getElementById("settings-profile-display");
  const settingsSoundBtn = document.getElementById("settings-sound-btn");
  const settingsNotifyBtn = document.getElementById("settings-notify-btn");
  const settingsVibrateBtn = document.getElementById("settings-vibrate-btn");
  const identityFingerprintEl = document.getElementById("identity-fingerprint");
  const copyFingerprintBtn = document.getElementById("copy-fingerprint-btn");
  const regenerateIdentityBtn = document.getElementById("regenerate-identity-btn");
  const openThemeBtn = document.getElementById("open-theme-btn");
  const themeToggle = document.getElementById("theme-toggle");
  const themePanel = document.getElementById("theme-panel");

  const STATUS_LABELS = {
    connected: "Connected",
    reconnecting: "Reconnecting…",
    offline: "Offline — check Wi‑Fi and server",
  };

  const LIVE_LABELS = {
    connected: "Live",
    reconnecting: "…",
    offline: "Off",
  };

  function isMobileLayout() {
    return HMConnection.isNativeApp() || window.matchMedia("(max-width: 640px)").matches;
  }

  function updateConnectionBanner(status) {
    if (statusEl && statusTextEl) {
      statusEl.hidden = status === "connected";
      statusEl.className = "connection-status connection-status--" + status;
      statusTextEl.textContent = STATUS_LABELS[status] || status;
    }
    if (liveBadgeEl) {
      liveBadgeEl.textContent = LIVE_LABELS[status] || "Off";
      liveBadgeEl.className = "live-badge live-badge--" + status;
      liveBadgeEl.title =
        status === "connected"
          ? "Connected to server"
          : status === "reconnecting"
            ? "Reconnecting to server"
            : "Disconnected from server";
    }
  }

  function setActiveTab(tab) {
    if (!bottomNav) {
      return;
    }
    bottomNav.querySelectorAll("[data-tab]").forEach(function (btn) {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    for (const key of Object.keys(tabPanels)) {
      const panel = tabPanels[key];
      if (panel) {
        panel.hidden = key !== tab;
      }
    }
    localStorage.setItem("hm-active-tab", tab);
  }

  function updateBottomNavVisibility() {
    if (!bottomNav) {
      return;
    }
    const show = document.body.classList.contains("joined") && isMobileLayout();
    bottomNav.hidden = !show;
    document.body.classList.toggle("has-bottom-nav", show);
    if (joinUrlCard) {
      joinUrlCard.classList.toggle("mobile-hidden", show || isMobileLayout());
    }
    if (onboardingStepName) {
      onboardingStepName.hidden = document.body.classList.contains("joined");
    }
  }

  function hideSplash() {
    if (!appSplash) {
      return;
    }
    appSplash.classList.add("app-splash--hide");
    window.setTimeout(function () {
      appSplash.hidden = true;
    }, 400);
  }

  function initSplash() {
    if (!appSplash) {
      return;
    }
    window.setTimeout(hideSplash, 1200);
  }

  function updateSettingsProfile(name, avatar) {
    if (!settingsProfile || !settingsProfileDisplay) {
      return;
    }
    if (name) {
      settingsProfile.hidden = false;
      settingsProfileDisplay.textContent = `${avatar || "😀"} ${name}`;
    } else {
      settingsProfile.hidden = true;
    }
  }

  function syncSettingsSoundBtn() {
    if (!settingsSoundBtn) {
      return;
    }
    const soundToggle = document.getElementById("sound-toggle");
    if (!soundToggle) {
      return;
    }
    const on = soundToggle.getAttribute("aria-pressed") === "true";
    settingsSoundBtn.textContent = on ? "🔊 Sound on" : "🔇 Sound off";
  }

  function syncNotificationSettings() {
    if (settingsNotifyBtn && typeof HMNotifications !== "undefined") {
      settingsNotifyBtn.textContent = HMNotifications.isNotifyEnabled()
        ? "🔔 Alerts on"
        : "🔕 Alerts off";
    }
    if (settingsVibrateBtn && typeof HMNotifications !== "undefined") {
      settingsVibrateBtn.textContent = HMNotifications.isVibrateEnabled()
        ? "📳 Vibration on"
        : "📳 Vibration off";
    }
    syncSettingsSoundBtn();
  }

  function updateDmBadge(count) {
    if (!dmNavBadge) {
      return;
    }
    if (count > 0) {
      dmNavBadge.hidden = false;
      dmNavBadge.textContent = count > 9 ? "9+" : String(count);
    } else {
      dmNavBadge.hidden = true;
    }
  }

  function focusChat() {
    if (messagesEl) {
      messagesEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    if (isMobileLayout()) {
      const composer = document.getElementById("chat-form");
      if (composer) {
        window.setTimeout(function () {
          composer.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 150);
      }
    }
  }

  function initBottomNav() {
    if (!bottomNav) {
      return;
    }
    const saved = localStorage.getItem("hm-active-tab") || "rooms";
    setActiveTab(saved);
    bottomNav.addEventListener("click", function (event) {
      const btn = event.target.closest("[data-tab]");
      if (!btn) {
        return;
      }
      setActiveTab(btn.dataset.tab);
      if (btn.dataset.tab === "dms") {
        focusChat();
      }
      if (typeof window.HMHaptic === "function") {
        window.HMHaptic();
      }
    });
  }

  function initPullToRefresh() {
    if (!messagesEl) {
      return;
    }
    let startY = 0;
    let pulling = false;
    const threshold = 72;

    messagesEl.addEventListener(
      "touchstart",
      function (event) {
        if (messagesEl.scrollTop > 0) {
          return;
        }
        startY = event.touches[0].clientY;
        pulling = true;
      },
      { passive: true }
    );

    messagesEl.addEventListener(
      "touchmove",
      function (event) {
        if (!pulling || messagesEl.scrollTop > 0) {
          return;
        }
        const delta = event.touches[0].clientY - startY;
        if (delta > threshold) {
          messagesEl.classList.add("pull-ready");
          if (pullHint) {
            pullHint.hidden = false;
          }
        } else {
          messagesEl.classList.remove("pull-ready");
          if (pullHint) {
            pullHint.hidden = true;
          }
        }
      },
      { passive: true }
    );

    messagesEl.addEventListener("touchend", function () {
      if (!pulling) {
        return;
      }
      pulling = false;
      if (pullHint) {
        pullHint.hidden = true;
      }
      if (messagesEl.classList.contains("pull-ready")) {
        messagesEl.classList.remove("pull-ready");
        if (typeof window.HMRefreshChat === "function") {
          window.HMRefreshChat();
        }
        if (typeof window.HMHaptic === "function") {
          window.HMHaptic();
        }
      }
    });
  }

  function initKeyboardScroll() {
    if (!messageInput) {
      return;
    }
    messageInput.addEventListener("focus", function () {
      if (!isMobileLayout()) {
        return;
      }
      window.setTimeout(function () {
        messageInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    });
  }

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) {
      return;
    }
    lightboxImg.src = src;
    lightboxImg.alt = alt || "Image preview";
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
  }

  function closeLightbox() {
    if (!lightbox) {
      return;
    }
    lightbox.hidden = true;
    lightboxImg.src = "";
    document.body.classList.remove("lightbox-open");
  }

  function initImageLightbox() {
    document.addEventListener("click", function (event) {
      const img = event.target.closest(".message-attachment img");
      if (img && img.src) {
        event.preventDefault();
        openLightbox(img.src, img.alt);
        return;
      }
      if (event.target === lightbox || event.target.classList.contains("image-lightbox-close")) {
        closeLightbox();
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeLightbox();
      }
    });
  }

  function updateServerSettings() {
    if (!serverUrlDisplay) {
      return;
    }
    const url = HMConnection.getServerBase();
    serverUrlDisplay.textContent = url || "Not connected";
    if (shareServerBtn) {
      shareServerBtn.hidden = !(navigator.share && url);
    }
    if (changeServerBtn) {
      changeServerBtn.hidden = !HMConnection.isNativeApp();
    }
  }

  async function copyServerUrl() {
    const url = HMConnection.getServerBase();
    if (!url) {
      alert("No server URL saved yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      if (copyServerBtn) {
        copyServerBtn.textContent = "Copied!";
        setTimeout(function () {
          copyServerBtn.textContent = "Copy server URL";
        }, 2000);
      }
    } catch (error) {
      prompt("Copy server URL:", url);
    }
  }

  async function shareServerUrl() {
    const url = HMConnection.getServerBase();
    if (!url || !navigator.share) {
      return;
    }
    const deepLink = HMConnection.buildDeepLink(url);
    try {
      await navigator.share({
        title: "Hotspot Messenger",
        text: "Join our chat:\n" + url + "\n" + deepLink,
        url: deepLink,
      });
    } catch (error) {
      if (!String(error).includes("cancel")) {
        copyServerUrl();
      }
    }
  }

  if (copyServerBtn) {
    copyServerBtn.addEventListener("click", copyServerUrl);
  }
  if (shareServerBtn) {
    shareServerBtn.addEventListener("click", shareServerUrl);
  }
  if (changeServerBtn) {
    changeServerBtn.addEventListener("click", function () {
      if (typeof window.HMShowServerScreen === "function") {
        window.HMShowServerScreen();
      }
    });
  }

  if (settingsSoundBtn) {
    settingsSoundBtn.addEventListener("click", function () {
      const soundToggle = document.getElementById("sound-toggle");
      if (soundToggle) {
        soundToggle.click();
        syncNotificationSettings();
      }
    });
  }

  if (settingsNotifyBtn) {
    settingsNotifyBtn.addEventListener("click", async function () {
      if (typeof HMNotifications === "undefined") {
        return;
      }
      const next = !HMNotifications.isNotifyEnabled();
      HMNotifications.setNotifyEnabled(next);
      if (next) {
        const granted = await HMNotifications.requestPermission();
        if (!granted) {
          alert("Notifications are blocked. Enable them in your phone or browser settings.");
        }
      }
      syncNotificationSettings();
    });
  }

  async function refreshIdentitySettings() {
    if (!identityFingerprintEl || typeof HMIdentity === "undefined") {
      return;
    }
    try {
      const info = await HMIdentity.ensureKeys();
      identityFingerprintEl.textContent = info.fingerprint || "—";
    } catch (error) {
      identityFingerprintEl.textContent = "Could not load identity key";
    }
  }

  if (copyFingerprintBtn) {
    copyFingerprintBtn.addEventListener("click", async function () {
      if (typeof HMIdentity === "undefined") {
        return;
      }
      await HMIdentity.ensureKeys();
      const fp = HMIdentity.getFingerprint();
      try {
        await navigator.clipboard.writeText(fp);
        copyFingerprintBtn.textContent = "Copied!";
        window.setTimeout(function () {
          copyFingerprintBtn.textContent = "Copy fingerprint";
        }, 2000);
      } catch (error) {
        prompt("Copy fingerprint:", fp);
      }
    });
  }

  if (regenerateIdentityBtn) {
    regenerateIdentityBtn.addEventListener("click", async function () {
      if (typeof HMIdentity === "undefined") {
        return;
      }
      if (
        !confirm(
          "Create a new identity key? Old auto-encrypted DMs may not decrypt until friends rejoin."
        )
      ) {
        return;
      }
      await HMIdentity.regenerateKeys();
      await refreshIdentitySettings();
      if (typeof window.HMRepublishIdentity === "function") {
        window.HMRepublishIdentity();
      }
      alert("New identity key created. Rejoin or reconnect so friends get your new public key.");
    });
  }

  if (settingsVibrateBtn) {
    settingsVibrateBtn.addEventListener("click", function () {
      if (typeof HMNotifications === "undefined") {
        return;
      }
      HMNotifications.toggleVibrate();
      syncNotificationSettings();
    });
  }

  if (openThemeBtn && themeToggle && themePanel) {
    openThemeBtn.addEventListener("click", function () {
      themePanel.hidden = false;
      themeToggle.setAttribute("aria-expanded", "true");
      if (typeof window.HMSwitchTab === "function") {
        window.HMSwitchTab("settings");
      }
    });
  }

  HMConnection.onStatusChange(updateConnectionBanner);
  updateConnectionBanner(HMConnection.getStatus());

  document.addEventListener("DOMContentLoaded", function () {
    initSplash();
    initBottomNav();
    initPullToRefresh();
    initImageLightbox();
    initKeyboardScroll();
    updateServerSettings();
    updateBottomNavVisibility();
    syncNotificationSettings();
    refreshIdentitySettings();
    if (typeof HMNotifications !== "undefined") {
      HMNotifications.init();
    }
  });

  window.HMUpdateServerSettings = updateServerSettings;
  window.HMSwitchTab = setActiveTab;
  window.HMFocusChat = focusChat;
  window.HMUpdateDmBadge = updateDmBadge;
  window.HMUpdateMobileChrome = updateBottomNavVisibility;
  window.HMUpdateSettingsProfile = updateSettingsProfile;
  window.HMSyncSettingsSound = syncSettingsSoundBtn;
  window.HMSyncNotificationSettings = syncNotificationSettings;
})();

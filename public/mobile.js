// Phase 3 — mobile UX: connection banner, bottom nav, pull-to-refresh, image lightbox
(function () {
  const statusEl = document.getElementById("connection-status");
  const statusTextEl = document.getElementById("connection-status-text");
  const bottomNav = document.getElementById("bottom-nav");
  const tabPanels = {
    rooms: document.getElementById("tab-rooms"),
    dms: document.getElementById("tab-dms"),
    settings: document.getElementById("tab-settings"),
  };
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImg = document.getElementById("image-lightbox-img");
  const messagesEl = document.getElementById("messages");
  const copyServerBtn = document.getElementById("copy-server-btn");
  const shareServerBtn = document.getElementById("share-server-btn");
  const serverUrlDisplay = document.getElementById("server-url-display");

  const STATUS_LABELS = {
    connected: "Connected",
    reconnecting: "Reconnecting…",
    offline: "Offline — check Wi‑Fi and server",
  };

  function updateConnectionBanner(status) {
    if (!statusEl || !statusTextEl) {
      return;
    }
    statusEl.hidden = status === "connected";
    statusEl.className = "connection-status connection-status--" + status;
    statusTextEl.textContent = STATUS_LABELS[status] || status;
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
        } else {
          messagesEl.classList.remove("pull-ready");
        }
      },
      { passive: true }
    );

    messagesEl.addEventListener("touchend", function () {
      if (!pulling) {
        return;
      }
      pulling = false;
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
    try {
      await navigator.share({ title: "Hotspot Messenger", text: "Join our chat:", url });
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

  HMConnection.onStatusChange(updateConnectionBanner);
  updateConnectionBanner(HMConnection.getStatus());

  document.addEventListener("DOMContentLoaded", function () {
    initBottomNav();
    initPullToRefresh();
    initImageLightbox();
    updateServerSettings();
    if (bottomNav && (HMConnection.isNativeApp() || window.matchMedia("(max-width: 640px)").matches)) {
      bottomNav.hidden = false;
      document.body.classList.add("has-bottom-nav");
    }
  });

  window.HMUpdateServerSettings = updateServerSettings;
})();

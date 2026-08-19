// Capacitor native features: server connect screen, QR scan, haptics
(function () {
  const connectScreen = document.getElementById("server-connect");
  const serverUrlInput = document.getElementById("server-url-input");
  const serverConnectBtn = document.getElementById("server-connect-btn");
  const scanQrBtn = document.getElementById("scan-qr-btn");
  const findServersBtn = document.getElementById("find-servers-btn");
  const serverConnectError = document.getElementById("server-connect-error");
  const recentServersWrap = document.getElementById("recent-servers-wrap");
  const recentServersList = document.getElementById("recent-servers-list");
  const foundServersWrap = document.getElementById("found-servers-wrap");
  const foundServersList = document.getElementById("found-servers-list");
  const appRoot = document.querySelector(".app");
  const joinUrlCard = document.getElementById("join-url-card");

  function showError(msg) {
    if (serverConnectError) {
      serverConnectError.textContent = msg;
      serverConnectError.hidden = !msg;
    }
  }

  function showServerScreen() {
    if (connectScreen) {
      connectScreen.hidden = false;
    }
    if (appRoot) {
      appRoot.hidden = true;
    }
    if (serverUrlInput && HMConnection.getSavedServerUrl()) {
      serverUrlInput.value = HMConnection.getSavedServerUrl();
    }
    refreshRecentServers();
    if (foundServersWrap) {
      foundServersWrap.hidden = true;
    }
    if (foundServersList) {
      foundServersList.innerHTML = "";
    }
  }

  function refreshRecentServers() {
    if (!window.HMDiscovery || !recentServersList) {
      return;
    }
    window.HMDiscovery.renderRecentServers(recentServersList, function (url) {
      if (serverUrlInput) {
        serverUrlInput.value = url;
      }
      connectFromInput();
    });
    if (recentServersWrap) {
      recentServersWrap.hidden = HMConnection.getRecentServers().length === 0;
    }
  }

  function hideServerScreen() {
    if (connectScreen) {
      connectScreen.hidden = true;
    }
    if (appRoot) {
      appRoot.hidden = false;
    }
    if (joinUrlCard && HMConnection.isNativeApp()) {
      joinUrlCard.hidden = true;
    }
  }

  async function hapticLight() {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        await window.Capacitor.Plugins.Haptics.impact({ style: "LIGHT" });
      }
    } catch (error) {
      // not available on web
    }
  }

  async function connectFromInput() {
    showError("");
    const url = serverUrlInput ? serverUrlInput.value : "";
    serverConnectBtn.disabled = true;
    serverConnectBtn.textContent = "Connecting…";
    try {
      await HMConnection.connectToServer(url);
      hideServerScreen();
      if (typeof window.HMSwitchTab === "function") {
        window.HMSwitchTab("rooms");
      }
      if (typeof window.HMBootChat === "function") {
        await window.HMBootChat();
      }
      await hapticLight();
    } catch (error) {
      showError(error.message || "Connection failed. Same Wi‑Fi? Server running?");
    } finally {
      serverConnectBtn.disabled = false;
      serverConnectBtn.textContent = "Connect";
    }
  }

  async function joinServerUrl(url) {
    if (serverUrlInput) {
      serverUrlInput.value = url;
    }
    if (connectScreen && connectScreen.hidden) {
      showServerScreen();
    }
    await connectFromInput();
  }

  async function findServersOnNetwork() {
    if (!window.HMDiscovery || !findServersBtn) {
      return;
    }

    showError("");
    findServersBtn.disabled = true;
    findServersBtn.textContent = "Searching…";
    if (foundServersWrap) {
      foundServersWrap.hidden = false;
    }
    if (foundServersList) {
      foundServersList.innerHTML = "";
    }

    const found = [];
    try {
      await window.HMDiscovery.findServersOnNetwork({
        onFound: function (server) {
          found.push(server);
          window.HMDiscovery.renderFoundServers(foundServersList, found, function (url) {
            if (serverUrlInput) {
              serverUrlInput.value = url;
            }
            connectFromInput();
          });
        },
      });

      if (found.length === 0) {
        showError("No servers found. Is the host computer running the app?");
      }
    } catch (error) {
      showError("Network scan failed.");
    } finally {
      findServersBtn.disabled = false;
      findServersBtn.textContent = "Find on network";
    }
  }

  async function scanQrCode() {
    showError("");
    try {
      const BarcodeScanner = window.Capacitor?.Plugins?.BarcodeScanner;
      if (!BarcodeScanner) {
        showError("QR scanner not available on this build.");
        return;
      }
      const result = await BarcodeScanner.scan();
      const code =
        result?.barcodes?.[0]?.displayValue ||
        result?.barcodes?.[0]?.rawValue ||
        result?.ScanResult ||
        result?.content;
      if (code) {
        serverUrlInput.value = code;
        await connectFromInput();
      }
    } catch (error) {
      if (String(error).includes("cancel")) {
        return;
      }
      showError("Could not scan QR code.");
    }
  }

  if (serverConnectBtn) {
    serverConnectBtn.addEventListener("click", connectFromInput);
  }

  if (scanQrBtn) {
    scanQrBtn.addEventListener("click", scanQrCode);
    if (!HMConnection.isNativeApp()) {
      scanQrBtn.hidden = true;
    }
  }

  if (findServersBtn) {
    findServersBtn.addEventListener("click", findServersOnNetwork);
    if (!HMConnection.isNativeApp()) {
      findServersBtn.hidden = true;
    }
  }

  if (serverUrlInput) {
    serverUrlInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        connectFromInput();
      }
    });
  }

  window.HMHaptic = hapticLight;
  window.HMShowServerScreen = showServerScreen;
  window.HMJoinServerUrl = joinServerUrl;

  function setupDeepLinks() {
    const App = window.Capacitor?.Plugins?.App;
    if (!App) {
      return;
    }

    App.addListener("appUrlOpen", function (event) {
      const target = HMConnection.parseJoinDeepLink(event.url);
      if (target) {
        joinServerUrl(target);
      }
    });

    App.getLaunchUrl()
      .then(function (result) {
        if (result && result.url) {
          const target = HMConnection.parseJoinDeepLink(result.url);
          if (target && HMConnection.needsServerScreen()) {
            if (serverUrlInput) {
              serverUrlInput.value = target;
            }
          }
        }
      })
      .catch(function () {
        // no launch URL
      });
  }

  window.HMNativeBoot = async function () {
    if (HMConnection.needsServerScreen()) {
      showServerScreen();
      return;
    }
    if (HMConnection.isNativeApp()) {
      try {
        await HMConnection.connectToServer(HMConnection.getSavedServerUrl());
      } catch (error) {
        showServerScreen();
        showError("Saved server unreachable. Enter the host IP again.");
        return;
      }
      hideServerScreen();
      if (typeof window.HMSwitchTab === "function") {
        window.HMSwitchTab("rooms");
      }
    }
    if (typeof window.HMBootChat === "function") {
      await window.HMBootChat();
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    setupDeepLinks();
    window.HMNativeBoot();
  });
})();

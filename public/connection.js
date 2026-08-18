// Server URL + Socket.io connection (web uses same host; native app connects to LAN IP)
const HMConnection = (function () {
  const SERVER_URL_KEY = "hm-server-url";
  let socket = null;
  let serverBase = "";
  let handlersBound = false;

  function isNativeApp() {
    return Boolean(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

  function normalizeBase(url) {
    let base = url.trim();
    if (!base) {
      return "";
    }
    if (!/^https?:\/\//i.test(base)) {
      base = "http://" + base;
    }
    return base.replace(/\/+$/, "");
  }

  function getSavedServerUrl() {
    return localStorage.getItem(SERVER_URL_KEY) || "";
  }

  function saveServerUrl(url) {
    localStorage.setItem(SERVER_URL_KEY, url);
  }

  function getServerBase() {
    if (serverBase) {
      return serverBase;
    }
    if (isNativeApp()) {
      return normalizeBase(getSavedServerUrl());
    }
    return window.location.origin;
  }

  function apiUrl(path) {
    const base = getServerBase();
    if (!path.startsWith("/")) {
      path = "/" + path;
    }
    return base + path;
  }

  function resolveAssetUrl(url) {
    if (!url || url.startsWith("http") || url.startsWith("blob:")) {
      return url;
    }
    return apiUrl(url);
  }

  function getSocket() {
    return socket;
  }

  function connectToServer(url) {
    return new Promise(function (resolve, reject) {
      const base = normalizeBase(url);
      if (!base) {
        reject(new Error("Enter a server address like http://192.168.1.5:3000"));
        return;
      }

      if (socket) {
        socket.disconnect();
        socket = null;
        handlersBound = false;
      }

      serverBase = base;
      saveServerUrl(base);

      socket = io(base, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 8,
      });

      const onConnect = function () {
        socket.off("connect_error", onError);
        resolve(socket);
      };

      const onError = function (err) {
        socket.off("connect", onConnect);
        socket.disconnect();
        socket = null;
        serverBase = "";
        reject(err || new Error("Could not connect to server"));
      };

      socket.once("connect", onConnect);
      socket.once("connect_error", onError);
    });
  }

  function bindHandlersOnce(registerFn) {
    if (!socket || handlersBound) {
      return;
    }
    registerFn(socket);
    handlersBound = true;
  }

  function needsServerScreen() {
    return isNativeApp() && !getSavedServerUrl();
  }

  return {
    isNativeApp,
    getSavedServerUrl,
    saveServerUrl,
    getServerBase,
    apiUrl,
    resolveAssetUrl,
    getSocket,
    connectToServer,
    bindHandlersOnce,
    needsServerScreen,
    normalizeBase,
  };
})();

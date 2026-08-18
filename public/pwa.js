// PWA helpers: service worker registration + "Install app" prompt
(function () {
  let deferredInstall = null;
  const installBtn = document.getElementById("install-app-btn");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function (error) {
        console.warn("Service worker registration failed:", error);
      });
    });
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredInstall = event;
    if (installBtn) {
      installBtn.hidden = false;
    }
  });

  if (installBtn) {
    installBtn.addEventListener("click", async function () {
      if (!deferredInstall) {
        return;
      }
      deferredInstall.prompt();
      await deferredInstall.userChoice;
      deferredInstall = null;
      installBtn.hidden = true;
    });
  }

  window.addEventListener("appinstalled", function () {
    deferredInstall = null;
    if (installBtn) {
      installBtn.hidden = true;
    }
  });
})();

// Phase 5 — local notifications, app badge, and alert settings
const HMNotifications = (function () {
  const NOTIFY_KEY = "hm-notify-enabled";
  const VIBRATE_KEY = "hm-vibrate-enabled";
  const NOTIFY_CHANNEL = "hm-messages";

  let notifyEnabled = localStorage.getItem(NOTIFY_KEY) !== "false";
  let vibrateEnabled = localStorage.getItem(VIBRATE_KEY) !== "false";
  let appIsActive = true;
  let unreadCount = 0;
  let nextNotificationId = 1;
  let nativeReady = false;

  function isNative() {
    return HMConnection.isNativeApp();
  }

  function getLocalNotifications() {
    return window.Capacitor?.Plugins?.LocalNotifications || null;
  }

  function isOnChatTab() {
    const tab = localStorage.getItem("hm-active-tab") || "rooms";
    return tab === "rooms" || tab === "dms";
  }

  function shouldNotify(isOwn, isVisibleChat) {
    if (isOwn) {
      return false;
    }
    return !isVisibleChat || document.hidden || !appIsActive || !isOnChatTab();
  }

  function isNotifyEnabled() {
    return notifyEnabled;
  }

  function isVibrateEnabled() {
    return vibrateEnabled;
  }

  function setNotifyEnabled(value) {
    notifyEnabled = Boolean(value);
    localStorage.setItem(NOTIFY_KEY, String(notifyEnabled));
    if (notifyEnabled) {
      requestPermission();
    }
    syncSettingsUI();
  }

  function setVibrateEnabled(value) {
    vibrateEnabled = Boolean(value);
    localStorage.setItem(VIBRATE_KEY, String(vibrateEnabled));
    syncSettingsUI();
  }

  function toggleNotify() {
    setNotifyEnabled(!notifyEnabled);
  }

  function toggleVibrate() {
    setVibrateEnabled(!vibrateEnabled);
  }

  async function ensureNativeChannel() {
    const LocalNotifications = getLocalNotifications();
    if (!LocalNotifications || nativeReady) {
      return;
    }
    try {
      await LocalNotifications.createChannel({
        id: NOTIFY_CHANNEL,
        name: "Messages",
        description: "New chat messages",
        importance: 4,
        visibility: 1,
        vibration: true,
      });
      nativeReady = true;
    } catch (error) {
      // channel may already exist
      nativeReady = true;
    }
  }

  async function requestPermission() {
    if (isNative()) {
      const LocalNotifications = getLocalNotifications();
      if (!LocalNotifications) {
        return false;
      }
      await ensureNativeChannel();
      const result = await LocalNotifications.requestPermissions();
      return result.display === "granted";
    }

    if (!("Notification" in window)) {
      return false;
    }
    if (Notification.permission === "granted") {
      return true;
    }
    if (Notification.permission === "denied") {
      return false;
    }
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  async function updateAppBadge() {
    if ("setAppBadge" in navigator) {
      try {
        if (unreadCount > 0) {
          await navigator.setAppBadge(unreadCount);
        } else if ("clearAppBadge" in navigator) {
          await navigator.clearAppBadge();
        }
      } catch (error) {
        // badge API not supported
      }
    }
  }

  function bumpUnread() {
    unreadCount += 1;
    if (typeof window.HMBumpTabBadge === "function") {
      window.HMBumpTabBadge();
    }
    updateAppBadge();
  }

  function clearUnread() {
    unreadCount = 0;
    if (typeof window.HMClearTabBadge === "function") {
      window.HMClearTabBadge();
    }
    updateAppBadge();
  }

  async function showNativeNotification(title, body) {
    const LocalNotifications = getLocalNotifications();
    if (!LocalNotifications) {
      return;
    }
    await ensureNativeChannel();
    const id = nextNotificationId;
    nextNotificationId += 1;
    if (nextNotificationId > 2147483000) {
      nextNotificationId = 1;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          channelId: NOTIFY_CHANNEL,
          iconColor: "#0d9488",
          schedule: { at: new Date(Date.now() + 300) },
        },
      ],
    });
  }

  function showWebNotification(title, body, tag) {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }
    try {
      const notification = new Notification(title, {
        body,
        tag: tag || "hm-message",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
      });
      notification.onclick = function () {
        window.focus();
        notification.close();
      };
    } catch (error) {
      // notifications blocked
    }
  }

  async function notifyIncoming(payload) {
    if (!notifyEnabled) {
      return;
    }

    const title = payload.title || "Hotspot Messenger";
    const body = payload.body || "New message";
    const tag = payload.tag || "hm-message";

    bumpUnread();

    if (isNative() && !appIsActive) {
      try {
        await showNativeNotification(title, body);
      } catch (error) {
        // permission denied or plugin unavailable
      }
      return;
    }

    if (document.hidden) {
      showWebNotification(title, body, tag);
    }
  }

  function syncSettingsUI() {
    if (typeof window.HMSyncNotificationSettings === "function") {
      window.HMSyncNotificationSettings();
    }
  }

  function init() {
    const App = window.Capacitor?.Plugins?.App;
    if (App) {
      App.addListener("appStateChange", function (state) {
        appIsActive = state.isActive;
        if (appIsActive) {
          clearUnread();
        }
      });
      App.getState()
        .then(function (state) {
          appIsActive = state.isActive;
        })
        .catch(function () {
          // ignore
        });
    }

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        clearUnread();
      }
    });

    if (notifyEnabled && isNative()) {
      ensureNativeChannel();
    }
  }

  return {
    init,
    shouldNotify,
    notifyIncoming,
    requestPermission,
    isNotifyEnabled,
    isVibrateEnabled,
    setNotifyEnabled,
    setVibrateEnabled,
    toggleNotify,
    toggleVibrate,
    clearUnread,
    bumpUnread,
  };
})();

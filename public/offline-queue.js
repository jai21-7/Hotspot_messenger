// Phase 8 — offline message queue: save messages when Wi‑Fi drops, send when back online
const HMOfflineQueue = (function () {
  const QUEUE_KEY = "hm-offline-queue";
  const MAX_QUEUE = 50;

  function load() {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (error) {
      return [];
    }
  }

  function save(list) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(list.slice(0, MAX_QUEUE)));
    updateBadge(list.length);
  }

  function count() {
    return load().length;
  }

  function isOnline() {
    return (
      typeof HMConnection !== "undefined" &&
      HMConnection.getStatus() === "connected" &&
      typeof socket !== "undefined" &&
      socket &&
      socket.connected
    );
  }

  function enqueue(entry) {
    const list = load();
    list.push({
      id: "q-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      createdAt: Date.now(),
      text: entry.text || "",
      chatMode: entry.chatMode,
      room: entry.room,
      channel: entry.channel,
      dmPartner: entry.dmPartner,
    });
    save(list);
    return list.length;
  }

  async function flush(sendEntry) {
    if (typeof sendEntry !== "function") {
      return 0;
    }
    const list = load();
    if (list.length === 0) {
      updateBadge(0);
      return 0;
    }

    let sent = 0;
    const remaining = [];

    for (const item of list) {
      try {
        const ok = await sendEntry(item);
        if (ok) {
          sent += 1;
        } else {
          remaining.push(item);
        }
      } catch (error) {
        remaining.push(item);
      }
    }

    save(remaining);
    return sent;
  }

  function updateBadge(count) {
    const badge = document.getElementById("offline-queue-badge");
    if (!badge) {
      return;
    }
    if (count > 0) {
      badge.hidden = false;
      badge.textContent = count > 9 ? "9+" : String(count);
    } else {
      badge.hidden = true;
    }
  }

  function init() {
    updateBadge(count());
    if (typeof HMConnection !== "undefined") {
      HMConnection.onStatusChange(function (status) {
        if (status === "connected" && typeof window.HMFlushOfflineQueue === "function") {
          window.HMFlushOfflineQueue();
        }
      });
    }
  }

  return {
    init,
    isOnline,
    enqueue,
    flush,
    count,
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  HMOfflineQueue.init();
});

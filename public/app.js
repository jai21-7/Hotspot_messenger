// Connect to the Socket.io server (same computer/hotspot host)
const socket = io();

const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const displayNameInput = document.getElementById("display-name");
const joinButton = document.getElementById("join-button");
const joinHint = document.getElementById("join-hint");
const onlineListEl = document.getElementById("online-list");
const onlineCountEl = document.getElementById("online-count");
const messagesEl = document.getElementById("messages");
const sendButton = document.getElementById("send-button");
const joinUrlEl = document.getElementById("join-url");
const copyJoinBtn = document.getElementById("copy-join-btn");
const modeGroupBtn = document.getElementById("mode-group");
const modeDmBtn = document.getElementById("mode-dm");
const dmBar = document.getElementById("dm-bar");
const dmBackBtn = document.getElementById("dm-back");
const dmPartnerEl = document.getElementById("dm-partner");
const charCounterEl = document.getElementById("char-counter");
const emojiToggle = document.getElementById("emoji-toggle");
const emojiPicker = document.getElementById("emoji-picker");
const typingIndicatorEl = document.getElementById("typing-indicator");
const soundToggle = document.getElementById("sound-toggle");

const MAX_MESSAGE_LENGTH = 500;
const HISTORY_KEY = "hm-chat-history";
const SOUND_KEY = "hm-sound-enabled";
const MAX_GROUP_HISTORY = 200;
const MAX_DM_HISTORY = 100;

let hasJoined = false;
let myName = "";
let chatMode = "group";
let activeDmPartner = null;
let lastDmPartner = null;
let joinUrls = [];
let soundEnabled = localStorage.getItem(SOUND_KEY) !== "false";
let typingTimeout = null;
let typingStopTimeout = null;
const typingUsers = new Map(); // name -> timeout id

const groupMessages = [];
const dmThreads = new Map();
const unreadDm = new Set();

// ── localStorage history ──
function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
    if (Array.isArray(saved.groupMessages)) {
      groupMessages.push(...saved.groupMessages.slice(-MAX_GROUP_HISTORY));
    }
    if (saved.dmThreads && typeof saved.dmThreads === "object") {
      for (const [partner, msgs] of Object.entries(saved.dmThreads)) {
        dmThreads.set(partner, msgs.slice(-MAX_DM_HISTORY));
      }
    }
    renderCurrentView();
  } catch (error) {
    // ignore corrupt storage
  }
}

function saveHistory() {
  const dmObj = {};
  for (const [partner, msgs] of dmThreads) {
    dmObj[partner] = msgs.slice(-MAX_DM_HISTORY);
  }
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify({
      groupMessages: groupMessages.slice(-MAX_GROUP_HISTORY),
      dmThreads: dmObj,
    })
  );
}

loadHistory();

// ── Sound ──
function playMessageSound() {
  if (!soundEnabled) {
    return;
  }
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (error) {
    // audio not supported
  }
}

function updateSoundToggle() {
  soundToggle.textContent = soundEnabled ? "🔊" : "🔇";
  soundToggle.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
  soundToggle.title = soundEnabled ? "Sound on — click to mute" : "Sound off — click to unmute";
}

soundToggle.addEventListener("click", function () {
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_KEY, String(soundEnabled));
  updateSoundToggle();
});
updateSoundToggle();

// ── Character counter ──
function updateCharCounter() {
  const len = messageInput.value.length;
  charCounterEl.textContent = `${len}/${MAX_MESSAGE_LENGTH}`;
  charCounterEl.classList.toggle("near-limit", len >= MAX_MESSAGE_LENGTH - 50);
  charCounterEl.classList.toggle("at-limit", len >= MAX_MESSAGE_LENGTH);
}

messageInput.addEventListener("input", function () {
  updateCharCounter();
  handleTyping();
});
updateCharCounter();

// ── Emoji picker ──
emojiToggle.addEventListener("click", function () {
  emojiPicker.hidden = !emojiPicker.hidden;
});

document.querySelectorAll(".emoji-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    messageInput.value += btn.dataset.emoji;
    messageInput.focus();
    updateCharCounter();
    handleTyping();
  });
});

document.addEventListener("click", function (event) {
  if (
    !emojiPicker.hidden &&
    !emojiPicker.contains(event.target) &&
    event.target !== emojiToggle
  ) {
    emojiPicker.hidden = true;
  }
});

// ── Copy join link ──
let copyResetTimeout = null;

async function copyJoinLink() {
  if (joinUrls.length === 0) {
    alert("No join link available yet. Connect to Wi‑Fi and refresh.");
    return;
  }
  const text = joinUrls[0];
  try {
    await navigator.clipboard.writeText(text);
    copyJoinBtn.textContent = "Copied!";
    clearTimeout(copyResetTimeout);
    copyResetTimeout = setTimeout(function () {
      copyJoinBtn.textContent = "Copy";
    }, 2000);
  } catch (error) {
    prompt("Copy this link:", text);
  }
}

copyJoinBtn.addEventListener("click", copyJoinLink);

// ── Typing indicator ──
function emitTyping(typing) {
  if (!hasJoined) {
    return;
  }
  const payload = { typing };
  if (chatMode === "dm" && activeDmPartner) {
    payload.to = activeDmPartner;
  }
  socket.emit("typing", payload);
}

function handleTyping() {
  if (!hasJoined) {
    return;
  }
  emitTyping(true);
  clearTimeout(typingStopTimeout);
  typingStopTimeout = setTimeout(function () {
    emitTyping(false);
  }, 2000);
}

function showTypingIndicator(name, typing, isDm) {
  if (isDm) {
    if (chatMode !== "dm" || !activeDmPartner || name !== activeDmPartner || name === myName) {
      return;
    }
    typingIndicatorEl.textContent = `${name} is typing…`;
    typingIndicatorEl.hidden = !typing;
    if (typing) {
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(function () {
        typingIndicatorEl.hidden = true;
      }, 3000);
    }
    return;
  }

  if (chatMode !== "group" || name === myName) {
    return;
  }

  if (typing) {
    typingUsers.set(name, true);
  } else {
    typingUsers.delete(name);
  }

  const names = Array.from(typingUsers.keys());
  if (names.length === 0) {
    typingIndicatorEl.hidden = true;
    return;
  }

  typingIndicatorEl.textContent =
    names.length === 1 ? `${names[0]} is typing…` : `${names.join(", ")} are typing…`;
  typingIndicatorEl.hidden = false;
}

socket.on("typing", function (data) {
  showTypingIndicator(data.name, data.typing, Boolean(data.dm));
});

// ── Helpers ──
function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getDmThread(partner) {
  if (!dmThreads.has(partner)) {
    dmThreads.set(partner, []);
  }
  return dmThreads.get(partner);
}

async function loadJoinInfo() {
  try {
    const response = await fetch("/api/join-info");
    const data = await response.json();

    if (!data.urls || data.urls.length === 0) {
      joinUrls = [];
      joinUrlEl.textContent =
        "Connect to Wi‑Fi/hotspot, restart the server, then refresh.";
      return;
    }

    joinUrls = data.urls;
    joinUrlEl.textContent = data.urls.join("  ·  ");
  } catch (error) {
    joinUrlEl.textContent = "Use the host IP shown in the terminal.";
  }
}

loadJoinInfo();

function joinChat() {
  const name = displayNameInput.value.trim();
  if (!name) {
    displayNameInput.focus();
    alert("Please enter your name first.");
    return;
  }

  myName = name;
  socket.emit("join", name);

  hasJoined = true;
  document.body.classList.add("joined");
  displayNameInput.disabled = true;
  joinButton.disabled = true;
  messageInput.disabled = false;
  sendButton.disabled = false;
  emojiToggle.disabled = false;
  messageInput.placeholder = "Type a message...";
  joinHint.textContent = `You're in as ${name}`;
  messageInput.focus();
}

joinButton.addEventListener("click", joinChat);

displayNameInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    joinChat();
  }
});

function setChatMode(mode, partner) {
  chatMode = mode;
  typingIndicatorEl.hidden = true;
  typingUsers.clear();

  if (mode === "dm" && partner) {
    lastDmPartner = partner;
    activeDmPartner = partner;
  } else if (mode === "group") {
    activeDmPartner = null;
  }

  modeGroupBtn.classList.toggle("active", mode === "group");
  modeGroupBtn.setAttribute("aria-pressed", mode === "group" ? "true" : "false");
  modeDmBtn.classList.toggle("active", mode === "dm");
  modeDmBtn.setAttribute("aria-pressed", mode === "dm" ? "true" : "false");
  modeDmBtn.disabled = !lastDmPartner;

  if (mode === "dm" && activeDmPartner) {
    dmBar.hidden = false;
    dmPartnerEl.textContent = activeDmPartner;
    modeDmBtn.textContent = `Direct · ${activeDmPartner}`;
    unreadDm.delete(activeDmPartner);
    messageInput.placeholder = `Private message to ${activeDmPartner}...`;
  } else {
    dmBar.hidden = true;
    modeDmBtn.textContent = lastDmPartner ? `Direct · ${lastDmPartner}` : "Direct";
    messageInput.placeholder = "Type a message...";
  }

  renderOnlineList(lastOnlineNames);
  renderCurrentView();
}

function openDm(partner) {
  if (!hasJoined) {
    alert("Join with a name first.");
    return;
  }
  if (partner === myName) {
    return;
  }
  setChatMode("dm", partner);
  messageInput.focus();
}

modeGroupBtn.addEventListener("click", function () {
  setChatMode("group");
  messageInput.focus();
});

dmBackBtn.addEventListener("click", function () {
  setChatMode("group");
  messageInput.focus();
});

modeDmBtn.addEventListener("click", function () {
  if (lastDmPartner) {
    openDm(lastDmPartner);
  }
});

chatForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!hasJoined) {
    alert("Please join with a name first.");
    displayNameInput.focus();
    return;
  }

  const text = messageInput.value.trim();
  if (!text) {
    messageInput.focus();
    return;
  }

  emitTyping(false);
  emojiPicker.hidden = true;

  if (chatMode === "dm" && activeDmPartner) {
    socket.emit("dm message", { to: activeDmPartner, text });
  } else {
    socket.emit("chat message", { text });
  }

  messageInput.value = "";
  updateCharCounter();
  messageInput.focus();
});

socket.on("chat message", function (data) {
  groupMessages.push({ type: "chat", ...data });
  saveHistory();

  if (data.name !== myName) {
    playMessageSound();
  }

  if (chatMode === "group") {
    renderCurrentView();
  }
});

socket.on("dm message", function (data) {
  const partner = data.from === myName ? data.to : data.from;
  getDmThread(partner).push({ type: "dm", ...data });
  saveHistory();

  if (data.from !== myName) {
    playMessageSound();
  }

  if (chatMode === "dm" && activeDmPartner === partner) {
    renderCurrentView();
  } else if (data.from !== myName) {
    unreadDm.add(partner);
    renderOnlineList(lastOnlineNames);
  }
});

socket.on("dm error", function (data) {
  alert(data.message || "Could not send private message.");
});

socket.on("system message", function (text) {
  groupMessages.push({ type: "system", text });
  saveHistory();
  if (chatMode === "group") {
    renderCurrentView();
  }
});

let lastOnlineNames = [];

socket.on("user list", function (names) {
  lastOnlineNames = names;
  renderOnlineList(names);
});

function renderOnlineList(names) {
  onlineListEl.innerHTML = "";

  if (!Array.isArray(names) || names.length === 0) {
    onlineCountEl.textContent = "0";
    const empty = document.createElement("span");
    empty.className = "online-empty";
    empty.textContent = "Nobody online yet";
    onlineListEl.appendChild(empty);
    return;
  }

  onlineCountEl.textContent = String(names.length);

  for (const name of names) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "user-chip";
    if (name === myName) {
      chip.classList.add("you");
      chip.disabled = true;
    } else {
      chip.addEventListener("click", function () {
        openDm(name);
      });
    }
    if (chatMode === "dm" && name === activeDmPartner) {
      chip.classList.add("dm-active");
    }
    if (unreadDm.has(name)) {
      chip.classList.add("unread");
    }

    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.textContent = getInitials(name);

    const label = document.createElement("span");
    label.textContent = name === myName ? `${name} (you)` : name;

    chip.appendChild(avatar);
    chip.appendChild(label);
    onlineListEl.appendChild(chip);
  }
}

function formatTime(isoString) {
  try {
    const date = isoString ? new Date(isoString) : new Date();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (error) {
    return "";
  }
}

function renderCurrentView() {
  messagesEl.innerHTML = "";

  if (chatMode === "dm" && activeDmPartner) {
    const thread = getDmThread(activeDmPartner);
    if (thread.length === 0) {
      messagesEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true">🔒</span>
          <p>Private chat with ${activeDmPartner}</p>
          <span class="empty-sub">Only you two can see messages here.</span>
        </div>`;
      return;
    }
    for (const msg of thread) {
      messagesEl.appendChild(buildDmMessageEl(msg));
    }
  } else {
    if (groupMessages.length === 0) {
      messagesEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true">💬</span>
          <p>No messages yet</p>
          <span class="empty-sub">Join the chat and say hello!</span>
        </div>`;
      return;
    }
    for (const msg of groupMessages) {
      if (msg.type === "system") {
        messagesEl.appendChild(buildSystemMessageEl(msg.text));
      } else {
        messagesEl.appendChild(buildChatMessageEl(msg));
      }
    }
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function buildChatMessageEl(msg) {
  const messageEl = document.createElement("article");
  messageEl.className = "message";
  if (msg.name === myName) {
    messageEl.classList.add("own");
  }

  const metaEl = document.createElement("div");
  metaEl.className = "meta";

  const authorEl = document.createElement("span");
  authorEl.className = "author";
  authorEl.textContent = msg.name === myName ? "You" : msg.name;

  const timeEl = document.createElement("time");
  timeEl.className = "time";
  timeEl.textContent = formatTime(msg.time);

  metaEl.appendChild(authorEl);
  metaEl.appendChild(timeEl);

  const textEl = document.createElement("p");
  textEl.className = "text";
  textEl.textContent = msg.text;

  messageEl.appendChild(metaEl);
  messageEl.appendChild(textEl);
  return messageEl;
}

function buildDmMessageEl(msg) {
  const isOwn = msg.from === myName;
  const messageEl = document.createElement("article");
  messageEl.className = "message dm";
  if (isOwn) {
    messageEl.classList.add("own");
  }

  const metaEl = document.createElement("div");
  metaEl.className = "meta";

  const authorEl = document.createElement("span");
  authorEl.className = "author";
  authorEl.textContent = isOwn ? "You" : msg.from;

  const timeEl = document.createElement("time");
  timeEl.className = "time";
  timeEl.textContent = formatTime(msg.time);

  metaEl.appendChild(authorEl);
  metaEl.appendChild(timeEl);

  const textEl = document.createElement("p");
  textEl.className = "text";
  textEl.textContent = msg.text;

  messageEl.appendChild(metaEl);
  messageEl.appendChild(textEl);

  const lockEl = document.createElement("span");
  lockEl.className = "dm-lock";
  lockEl.textContent = "🔒";
  lockEl.title = "Private message";
  messageEl.appendChild(lockEl);

  return messageEl;
}

function buildSystemMessageEl(text) {
  const messageEl = document.createElement("article");
  messageEl.className = "message system";
  messageEl.textContent = text;
  return messageEl;
}

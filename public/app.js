// Socket connects via HMConnection (see connection.js + native.js)
let socket = null;

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
const joinQrEl = document.getElementById("join-qr");
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
const avatarOptionsEl = document.getElementById("avatar-options");
const searchBarEl = document.getElementById("search-bar");
const searchInputEl = document.getElementById("search-input");
const searchClearEl = document.getElementById("search-clear");
const roomsSectionEl = document.getElementById("rooms-section");
const roomSelectEl = document.getElementById("room-select");
const channelListEl = document.getElementById("channel-list");
const createRoomBtn = document.getElementById("create-room-btn");
const createChannelBtn = document.getElementById("create-channel-btn");
const roomPassphraseEl = document.getElementById("room-passphrase");
const unlockRoomBtn = document.getElementById("unlock-room-btn");
const privacyStatusEl = document.getElementById("privacy-status");
const attachBtn = document.getElementById("attach-btn");
const fileInputEl = document.getElementById("file-input");
const dmPassphraseEl = document.getElementById("dm-passphrase");
const unlockDmBtn = document.getElementById("unlock-dm-btn");

const MAX_MESSAGE_LENGTH = 500;
const HISTORY_KEY = "hm-chat-history";
const SOUND_KEY = "hm-sound-enabled";
const AVATAR_KEY = "hm-avatar";
const MAX_CHANNEL_HISTORY = 200;
const MAX_DM_HISTORY = 100;
const BASE_TITLE = "Hotspot Messenger";
const DEFAULT_AVATARS = ["😀", "🦊", "🐼", "🐯", "🦁", "🐸", "🐙", "🦄", "🐲", "🎮", "⚡", "🌟"];

let hasJoined = false;
let myName = "";
let myAvatar = localStorage.getItem(AVATAR_KEY) || "😀";
let chatMode = "channel";
let activeRoom = "main";
let activeChannel = "general";
let activeDmPartner = null;
let lastDmPartner = null;
let joinUrls = [];
let maxFileSize = 5 * 1024 * 1024;
let searchQuery = "";
let soundEnabled = localStorage.getItem(SOUND_KEY) !== "false";
let typingTimeout = null;
let typingStopTimeout = null;
let unreadBadgeCount = 0;
let pendingAttachment = null;
const typingUsers = new Map();
const userAvatars = new Map();
const roomPassphrases = new Map();
const dmPassphrases = new Map();
let roomsData = {};

const channelMessages = new Map();
const dmThreads = new Map();
const unreadDm = new Set();

function channelKey(room, channel) {
  return `${room}:${channel}`;
}

function getChannelStore(room, channel) {
  const key = channelKey(room, channel);
  if (!channelMessages.has(key)) {
    channelMessages.set(key, []);
  }
  return channelMessages.get(key);
}

// ── Avatar picker ──
function renderAvatarPicker(avatars) {
  const options = Array.isArray(avatars) && avatars.length > 0 ? avatars : DEFAULT_AVATARS;
  avatarOptionsEl.innerHTML = "";

  for (const emoji of options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "avatar-option";
    btn.textContent = emoji;
    btn.title = `Use ${emoji} as your avatar`;
    btn.setAttribute("aria-pressed", emoji === myAvatar ? "true" : "false");
    if (emoji === myAvatar) {
      btn.classList.add("selected");
    }
    btn.addEventListener("click", function () {
      myAvatar = emoji;
      localStorage.setItem(AVATAR_KEY, emoji);
      avatarOptionsEl.querySelectorAll(".avatar-option").forEach(function (el) {
        el.classList.toggle("selected", el.textContent === emoji);
        el.setAttribute("aria-pressed", el.textContent === emoji ? "true" : "false");
      });
    });
    avatarOptionsEl.appendChild(btn);
  }
}

renderAvatarPicker(DEFAULT_AVATARS);

function getAvatarFor(name) {
  if (name === myName) {
    return myAvatar;
  }
  return userAvatars.get(name) || "😀";
}

// ── Notification badge (tab title) ──
function updateTabTitle() {
  if (unreadBadgeCount > 0 && document.hidden) {
    document.title = `(${unreadBadgeCount}) ${BASE_TITLE}`;
  } else {
    document.title = BASE_TITLE;
  }
}

function bumpUnreadBadge() {
  if (!document.hidden) {
    return;
  }
  unreadBadgeCount += 1;
  updateTabTitle();
}

function clearUnreadBadge() {
  unreadBadgeCount = 0;
  updateTabTitle();
}

document.addEventListener("visibilitychange", function () {
  if (!document.hidden) {
    clearUnreadBadge();
  }
});

// ── Search ──
function setSearchQuery(value) {
  searchQuery = value.trim().toLowerCase();
  searchClearEl.hidden = searchQuery.length === 0;
  renderCurrentView();
}

searchInputEl.addEventListener("input", function () {
  setSearchQuery(searchInputEl.value);
});

searchClearEl.addEventListener("click", function () {
  searchInputEl.value = "";
  setSearchQuery("");
  searchInputEl.focus();
});

function messageMatchesSearch(msg) {
  if (!searchQuery) {
    return true;
  }
  const text = (msg.text || "").toLowerCase();
  const name = (msg.name || msg.from || "").toLowerCase();
  const attach = msg.attachment && msg.attachment.name ? msg.attachment.name.toLowerCase() : "";
  return text.includes(searchQuery) || name.includes(searchQuery) || attach.includes(searchQuery);
}

function isRoomEncrypted(roomId) {
  return Boolean(roomsData[roomId] && roomsData[roomId].encrypted);
}

function getRoomPassphrase(roomId) {
  return roomPassphrases.get(roomId) || "";
}

function getDmPassphrase(partner) {
  return dmPassphrases.get(partner) || "";
}

function updatePrivacyUI() {
  const encrypted = isRoomEncrypted(activeRoom);
  const unlocked = Boolean(getRoomPassphrase(activeRoom));
  privacyStatusEl.textContent = encrypted ? (unlocked ? "Unlocked" : "Locked") : "Off";
  privacyStatusEl.classList.toggle("unlocked", encrypted && unlocked);
  document.getElementById("privacy-panel").style.display = encrypted ? "block" : "none";
}

async function decryptMessageContent(msg, scope, passphrase) {
  if (!msg.encrypted || !msg.ciphertext || !msg.iv) {
    return msg.text || "";
  }
  if (!passphrase) {
    return "🔒 Encrypted — enter passphrase to read";
  }
  const plain = await CryptoHelper.decryptText(msg.ciphertext, msg.iv, passphrase, scope);
  return plain || "🔒 Could not decrypt — wrong passphrase?";
}

async function prepareOutgoingText(text, scope, passphrase, forceEncrypt) {
  if (!forceEncrypt || !passphrase) {
    return { text, encrypted: false };
  }
  const enc = await CryptoHelper.encryptText(text, passphrase, scope);
  return { encrypted: true, ciphertext: enc.ciphertext, iv: enc.iv, text: "" };
}

async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(HMConnection.apiUrl("/api/upload"), { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(function () {
      return { error: "Upload failed" };
    });
    throw new Error(err.error || "Upload failed");
  }
  return res.json();
}

function renderRoomsUI() {
  roomSelectEl.innerHTML = "";
  for (const [id, room] of Object.entries(roomsData)) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = room.encrypted ? `${room.name} 🔐` : room.name;
    if (id === activeRoom) {
      opt.selected = true;
    }
    roomSelectEl.appendChild(opt);
  }

  channelListEl.innerHTML = "";
  const room = roomsData[activeRoom];
  if (!room) {
    return;
  }
  for (const ch of room.channels) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "channel-btn";
    if (ch === activeChannel) {
      btn.classList.add("active");
    }
    if (room.encrypted) {
      btn.classList.add("encrypted");
    }
    btn.textContent = ch;
    btn.addEventListener("click", function () {
      switchChannel(activeRoom, ch);
    });
    channelListEl.appendChild(btn);
  }
  updatePrivacyUI();
}

function switchChannel(room, channel) {
  if (chatMode === "dm") {
    setChatMode("channel");
  }
  activeRoom = room;
  activeChannel = channel;
  socket.emit("join channel", { room, channel });
  renderRoomsUI();
  modeGroupBtn.textContent = `#${channel}`;
  if (typeof window.HMFocusChat === "function") {
    window.HMFocusChat();
  }
}

roomSelectEl.addEventListener("change", function () {
  const room = roomSelectEl.value;
  const channels = roomsData[room] ? roomsData[room].channels : ["general"];
  switchChannel(room, channels[0]);
});

createRoomBtn.addEventListener("click", function () {
  const roomId = prompt("Room id (letters/numbers, e.g. study-group):");
  if (!roomId) {
    return;
  }
  const name = prompt("Display name for the room:", roomId) || roomId;
  const encrypted = confirm("Enable private (encrypted) mode for this room?");
  socket.emit("create room", { roomId, name, encrypted });
});

createChannelBtn.addEventListener("click", function () {
  const channel = prompt("Channel name (e.g. homework):");
  if (!channel) {
    return;
  }
  socket.emit("create channel", { room: activeRoom, channel });
});

unlockRoomBtn.addEventListener("click", function () {
  const pass = roomPassphraseEl.value.trim();
  if (!pass) {
    alert("Enter the room passphrase.");
    return;
  }
  roomPassphrases.set(activeRoom, pass);
  sessionStorage.setItem(`hm-pass-${activeRoom}`, pass);
  updatePrivacyUI();
  renderCurrentView();
});

unlockDmBtn.addEventListener("click", function () {
  if (!activeDmPartner) {
    return;
  }
  const pass = dmPassphraseEl.value.trim();
  if (!pass) {
    alert("Enter a DM passphrase.");
    return;
  }
  dmPassphrases.set(activeDmPartner, pass);
  renderCurrentView();
});

attachBtn.addEventListener("click", function () {
  fileInputEl.click();
});

fileInputEl.addEventListener("change", function () {
  const file = fileInputEl.files && fileInputEl.files[0];
  if (!file) {
    return;
  }
  if (file.size > maxFileSize) {
    alert(`File too large. Max ${Math.round(maxFileSize / 1024 / 1024)} MB.`);
    fileInputEl.value = "";
    return;
  }
  pendingAttachment = file;
  showPendingAttachment();
  fileInputEl.value = "";
});

function showPendingAttachment() {
  let bar = document.getElementById("pending-attach-bar");
  if (!pendingAttachment) {
    if (bar) {
      bar.remove();
    }
    return;
  }
  if (!bar) {
    bar = document.createElement("p");
    bar.id = "pending-attach-bar";
    bar.className = "pending-attach";
    chatForm.insertAdjacentElement("beforebegin", bar);
  }
  bar.innerHTML = "";
  const label = document.createElement("span");
  label.textContent = `📎 ${pendingAttachment.name}`;
  const clear = document.createElement("button");
  clear.type = "button";
  clear.textContent = "✕";
  clear.addEventListener("click", function () {
    pendingAttachment = null;
    showPendingAttachment();
  });
  bar.appendChild(label);
  bar.appendChild(clear);
}

// ── localStorage cache (backup); server history loads on join ──
function saveHistory() {
  const dmObj = {};
  const chObj = {};
  for (const [partner, msgs] of dmThreads) {
    dmObj[partner] = msgs.slice(-MAX_DM_HISTORY);
  }
  for (const [key, msgs] of channelMessages) {
    chObj[key] = msgs.slice(-MAX_CHANNEL_HISTORY);
  }
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify({ channelMessages: chObj, dmThreads: dmObj })
  );
}

function applyChannelHistory(room, channel, messages) {
  const store = getChannelStore(room, channel);
  store.length = 0;
  if (!Array.isArray(messages)) {
    return;
  }
  for (const msg of messages) {
    if (msg.type === "system") {
      store.push({ type: "system", id: msg.id, text: msg.text, time: msg.time });
    } else {
      store.push({
        type: "chat",
        id: msg.id,
        name: msg.name,
        text: msg.text,
        time: msg.time,
        edited: Boolean(msg.edited),
        encrypted: Boolean(msg.encrypted),
        ciphertext: msg.ciphertext,
        iv: msg.iv,
        attachment: msg.attachment || null,
      });
    }
  }
  saveHistory();
  if (chatMode === "channel" && activeRoom === room && activeChannel === channel) {
    renderCurrentView();
  }
}

function applyDmHistory(threads) {
  if (!threads || typeof threads !== "object") {
    return;
  }
  for (const [partner, messages] of Object.entries(threads)) {
    dmThreads.set(
      partner,
      messages.map(function (m) {
        return {
          type: "dm",
          id: m.id,
          from: m.from,
          to: m.to,
          text: m.text,
          time: m.time,
          edited: Boolean(m.edited),
          encrypted: Boolean(m.encrypted),
          ciphertext: m.ciphertext,
          iv: m.iv,
          attachment: m.attachment || null,
        };
      })
    );
  }
  saveHistory();
  if (chatMode === "dm" && activeDmPartner) {
    renderCurrentView();
  }
}

function registerSocketHandlers(sock) {
  socket = sock;

socket.on("channel history", function (data) {
  applyChannelHistory(data.room, data.channel, data.messages);
});

socket.on("channel joined", function (data) {
  activeRoom = data.room;
  activeChannel = data.channel;
  const saved = sessionStorage.getItem(`hm-pass-${data.room}`);
  if (saved) {
    roomPassphrases.set(data.room, saved);
  }
  renderRoomsUI();
  renderCurrentView();
});

socket.on("rooms list", function (rooms) {
  roomsData = rooms || {};
  renderRoomsUI();
});

socket.on("room error", function (data) {
  alert(data.message || "Room error.");
});

socket.on("channel message", function (data) {
  if (data.type !== "system") {
    return;
  }
  const store = getChannelStore(data.room, data.channel);
  store.push({ type: "system", text: data.text });
  saveHistory();
  if (chatMode === "channel" && activeRoom === data.room && activeChannel === data.channel) {
    renderCurrentView();
  }
});

socket.on("dm history", function (data) {
  applyDmHistory(data.threads);
});

// ── Sound + haptics ──
function hapticLight() {
  if (typeof window.HMHaptic === "function") {
    window.HMHaptic();
  }
}

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
  if (typeof window.HMSyncSettingsSound === "function") {
    window.HMSyncSettingsSound();
  }
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

// ── Copy join link + QR ──
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

function updateJoinQr(url) {
  if (!url) {
    joinQrEl.hidden = true;
    return;
  }
  joinQrEl.src = HMConnection.apiUrl(`/api/qr?url=${encodeURIComponent(url)}`);
  joinQrEl.hidden = false;
}

// ── Typing indicator ──
function emitTyping(typing) {
  if (!hasJoined) {
    return;
  }
  const payload = { typing };
  if (chatMode === "dm" && activeDmPartner) {
    payload.to = activeDmPartner;
  } else if (chatMode === "channel") {
    payload.room = activeRoom;
    payload.channel = activeChannel;
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

  if (chatMode !== "channel" || name === myName) {
    return;
  }
  if (data.room && (data.room !== activeRoom || data.channel !== activeChannel)) {
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
function getDmThread(partner) {
  if (!dmThreads.has(partner)) {
    dmThreads.set(partner, []);
  }
  return dmThreads.get(partner);
}

function findChannelMessageIndex(room, channel, id) {
  const store = getChannelStore(room, channel);
  return store.findIndex(function (m) {
    return m.id === id;
  });
}

function findDmMessage(partner, id) {
  const thread = getDmThread(partner);
  return thread.find(function (m) {
    return m.id === id;
  });
}

async function loadJoinInfo() {
  try {
    const response = await fetch(HMConnection.apiUrl("/api/join-info"));
    const data = await response.json();

    if (data.rooms) {
      roomsData = data.rooms;
    }
    if (data.maxFileSize) {
      maxFileSize = data.maxFileSize;
    }

    if (data.avatars) {
      renderAvatarPicker(data.avatars);
    }

    if (HMConnection.isNativeApp()) {
      joinUrls = [HMConnection.getServerBase()];
      joinUrlEl.textContent = `Connected to ${joinUrls[0]}`;
      updateJoinQr(null);
      return;
    }

    if (!data.urls || data.urls.length === 0) {
      joinUrls = [];
      joinUrlEl.textContent =
        "Connect to Wi‑Fi/hotspot, restart the server, then refresh.";
      updateJoinQr(null);
      return;
    }

    joinUrls = data.urls;
    joinUrlEl.textContent = data.urls.join("  ·  ");
    updateJoinQr(data.urls[0]);
  } catch (error) {
    joinUrlEl.textContent = "Use the host IP shown in the terminal.";
    updateJoinQr(null);
  }
}

function joinChat() {
  const name = displayNameInput.value.trim();
  if (!name) {
    displayNameInput.focus();
    alert("Please enter your name first.");
    return;
  }

  myName = name;
  socket.emit("join", { name, avatar: myAvatar });

  hasJoined = true;
  document.body.classList.add("joined");
  displayNameInput.disabled = true;
  joinButton.disabled = true;
  messageInput.disabled = false;
  sendButton.disabled = false;
  emojiToggle.disabled = false;
  attachBtn.disabled = false;
  searchBarEl.hidden = false;
  roomsSectionEl.hidden = false;
  renderRoomsUI();
  messageInput.placeholder = "Type a message...";
  joinHint.textContent = `${myAvatar} You're in as ${name}`;
  messageInput.focus();
  if (typeof window.HMUpdateMobileChrome === "function") {
    window.HMUpdateMobileChrome();
  }
  if (typeof window.HMUpdateSettingsProfile === "function") {
    window.HMUpdateSettingsProfile(myName, myAvatar);
  }
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
  } else if (mode === "channel") {
    activeDmPartner = null;
  }

  modeGroupBtn.classList.toggle("active", mode === "channel");
  modeGroupBtn.setAttribute("aria-pressed", mode === "channel" ? "true" : "false");
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
    modeGroupBtn.textContent = `#${activeChannel}`;
    messageInput.placeholder = `Message #${activeChannel}...`;
  }

  renderOnlineList(lastOnlineUsers);
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
  if (typeof window.HMSwitchTab === "function") {
    window.HMSwitchTab("dms");
  }
  if (typeof window.HMFocusChat === "function") {
    window.HMFocusChat();
  }
  messageInput.focus();
}

modeGroupBtn.addEventListener("click", function () {
  setChatMode("channel");
  messageInput.focus();
});

dmBackBtn.addEventListener("click", function () {
  setChatMode("channel");
  messageInput.focus();
});

modeDmBtn.addEventListener("click", function () {
  if (lastDmPartner) {
    openDm(lastDmPartner);
  }
});

chatForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (!hasJoined) {
    alert("Please join with a name first.");
    displayNameInput.focus();
    return;
  }

  const text = messageInput.value.trim();
  if (!text && !pendingAttachment) {
    messageInput.focus();
    return;
  }

  emitTyping(false);
  emojiPicker.hidden = true;

  let attachment = null;
  try {
    if (pendingAttachment) {
      let fileToUpload = pendingAttachment;
      let encIv = null;
      if (chatMode === "channel" && isRoomEncrypted(activeRoom) && getRoomPassphrase(activeRoom)) {
        const enc = await CryptoHelper.encryptBlob(
          pendingAttachment,
          getRoomPassphrase(activeRoom),
          CryptoHelper.roomScope(activeRoom)
        );
        fileToUpload = new File([enc.blob], pendingAttachment.name + ".enc", {
          type: "application/octet-stream",
        });
        encIv = enc.iv;
      }
      const uploaded = await uploadFile(fileToUpload);
      attachment = {
        fileId: uploaded.fileId,
        name: pendingAttachment.name,
        mime: pendingAttachment.type,
        size: pendingAttachment.size,
        url: uploaded.url,
        encrypted: Boolean(encIv),
        iv: encIv,
      };
      pendingAttachment = null;
      showPendingAttachment();
    }

    if (chatMode === "dm" && activeDmPartner) {
      const dmPass = getDmPassphrase(activeDmPartner);
      const scope = CryptoHelper.dmScope(myName, activeDmPartner);
      const payload = { to: activeDmPartner, attachment };
      if (text && dmPass) {
        const enc = await CryptoHelper.encryptText(text, dmPass, scope);
        payload.encrypted = true;
        payload.ciphertext = enc.ciphertext;
        payload.iv = enc.iv;
      } else {
        payload.text = text;
      }
      socket.emit("dm message", payload);
    } else {
      const roomPass = getRoomPassphrase(activeRoom);
      const scope = CryptoHelper.roomScope(activeRoom);
      const payload = { attachment };
      if (text) {
        const prepared = await prepareOutgoingText(
          text,
          scope,
          roomPass,
          isRoomEncrypted(activeRoom)
        );
        Object.assign(payload, prepared);
      }
      socket.emit("chat message", payload);
    }
  } catch (error) {
    alert(error.message || "Could not send message.");
    return;
  }

  messageInput.value = "";
  updateCharCounter();
  messageInput.focus();
  hapticLight();
});

function shouldNotifyForIncoming(isOwn, isVisibleChat) {
  return !isOwn && (!isVisibleChat || document.hidden);
}

socket.on("chat message", function (data) {
  const room = data.room || activeRoom;
  const channel = data.channel || activeChannel;
  getChannelStore(room, channel).push({
    type: "chat",
    id: data.id,
    name: data.name,
    text: data.text,
    time: data.time,
    edited: Boolean(data.edited),
    encrypted: Boolean(data.encrypted),
    ciphertext: data.ciphertext,
    iv: data.iv,
    attachment: data.attachment || null,
  });
  saveHistory();

  const isVisibleChat =
    chatMode === "channel" && activeRoom === room && activeChannel === channel;
  if (data.name !== myName) {
    playMessageSound();
    hapticLight();
    if (shouldNotifyForIncoming(false, isVisibleChat)) {
      bumpUnreadBadge();
    }
  }

  if (isVisibleChat) {
    renderCurrentView();
  }
});

socket.on("dm message", function (data) {
  const partner = data.from === myName ? data.to : data.from;
  getDmThread(partner).push({
    type: "dm",
    id: data.id,
    from: data.from,
    to: data.to,
    text: data.text,
    time: data.time,
    edited: Boolean(data.edited),
    encrypted: Boolean(data.encrypted),
    ciphertext: data.ciphertext,
    iv: data.iv,
    attachment: data.attachment || null,
  });
  saveHistory();

  const isVisibleChat = chatMode === "dm" && activeDmPartner === partner;
  if (data.from !== myName) {
    playMessageSound();
    hapticLight();
    if (shouldNotifyForIncoming(false, isVisibleChat)) {
      bumpUnreadBadge();
    }
  }

  if (isVisibleChat) {
    renderCurrentView();
  } else if (data.from !== myName) {
    unreadDm.add(partner);
    renderOnlineList(lastOnlineUsers);
  }
});

socket.on("message updated", function (data) {
  if (data.dm) {
    const partner = data.from === myName ? data.to : data.from;
    const msg = findDmMessage(partner, data.id);
    if (msg) {
      if (data.encrypted) {
        msg.encrypted = true;
        msg.ciphertext = data.ciphertext;
        msg.iv = data.iv;
        msg.text = "";
      } else {
        msg.text = data.text;
      }
      msg.edited = true;
      saveHistory();
    }
    if (chatMode === "dm" && activeDmPartner === partner) {
      renderCurrentView();
    }
    return;
  }

  const index = findChannelMessageIndex(data.room || activeRoom, data.channel || activeChannel, data.id);
  if (index !== -1) {
    const store = getChannelStore(data.room || activeRoom, data.channel || activeChannel);
    if (data.encrypted) {
      store[index].encrypted = true;
      store[index].ciphertext = data.ciphertext;
      store[index].iv = data.iv;
      store[index].text = "";
    } else {
      store[index].text = data.text;
    }
    store[index].edited = true;
    saveHistory();
  }
  if (
    chatMode === "channel" &&
    activeRoom === (data.room || activeRoom) &&
    activeChannel === (data.channel || activeChannel)
  ) {
    renderCurrentView();
  }
});

socket.on("message deleted", function (data) {
  if (data.dm) {
    const partner = data.from === myName ? data.to : data.from;
    const thread = getDmThread(partner);
    const index = thread.findIndex(function (m) {
      return m.id === data.id;
    });
    if (index !== -1) {
      thread.splice(index, 1);
      saveHistory();
    }
    if (chatMode === "dm" && activeDmPartner === partner) {
      renderCurrentView();
    }
    return;
  }

  const room = data.room || activeRoom;
  const channel = data.channel || activeChannel;
  const index = findChannelMessageIndex(room, channel, data.id);
  if (index !== -1) {
    getChannelStore(room, channel).splice(index, 1);
    saveHistory();
  }
  if (chatMode === "channel" && activeRoom === room && activeChannel === channel) {
    renderCurrentView();
  }
});

socket.on("dm error", function (data) {
  alert(data.message || "Could not send private message.");
});

socket.on("system message", function (text) {
  getChannelStore(activeRoom, activeChannel).push({ type: "system", text });
  saveHistory();
  if (chatMode === "channel") {
    renderCurrentView();
  }
});

let lastOnlineUsers = [];

socket.on("user list", function (users) {
  lastOnlineUsers = users;
  userAvatars.clear();
  if (Array.isArray(users)) {
    for (const user of users) {
      if (user && typeof user === "object" && user.name) {
        userAvatars.set(user.name, user.avatar || "😀");
      }
    }
  }
  renderOnlineList(users);
});
}

window.HMBootChat = async function () {
  if (!socket) {
    if (HMConnection.isNativeApp()) {
      socket = HMConnection.getSocket();
    } else {
      await HMConnection.connectToServer(window.location.origin);
      socket = HMConnection.getSocket();
    }
  }
  HMConnection.watchSocket(socket);
  HMConnection.bindHandlersOnce(registerSocketHandlers);
  await loadJoinInfo();
  if (typeof window.HMUpdateServerSettings === "function") {
    window.HMUpdateServerSettings();
  }
};

function syncDmNavBadge() {
  if (typeof window.HMUpdateDmBadge === "function") {
    window.HMUpdateDmBadge(unreadDm.size);
  }
}

function renderOnlineList(users) {
  onlineListEl.innerHTML = "";

  if (!Array.isArray(users) || users.length === 0) {
    onlineCountEl.textContent = "0";
    const empty = document.createElement("span");
    empty.className = "online-empty";
    empty.textContent = "Nobody online yet";
    onlineListEl.appendChild(empty);
    syncDmNavBadge();
    return;
  }

  onlineCountEl.textContent = String(users.length);

  for (const user of users) {
    const name = typeof user === "string" ? user : user.name;
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
    avatar.className = "avatar emoji-avatar";
    avatar.textContent = getAvatarFor(name);

    const label = document.createElement("span");
    label.textContent = name === myName ? `${name} (you)` : name;

    chip.appendChild(avatar);
    chip.appendChild(label);
    onlineListEl.appendChild(chip);
  }
  syncDmNavBadge();
}

function formatTime(isoString) {
  try {
    const date = isoString ? new Date(isoString) : new Date();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (error) {
    return "";
  }
}

function highlightText(text) {
  const span = document.createElement("span");
  span.textContent = text;
  if (!searchQuery) {
    return span;
  }
  const lower = text.toLowerCase();
  const index = lower.indexOf(searchQuery);
  if (index === -1) {
    return span;
  }
  const before = text.slice(0, index);
  const match = text.slice(index, index + searchQuery.length);
  const after = text.slice(index + searchQuery.length);
  const frag = document.createDocumentFragment();
  if (before) {
    frag.appendChild(document.createTextNode(before));
  }
  const mark = document.createElement("mark");
  mark.className = "search-hit";
  mark.textContent = match;
  frag.appendChild(mark);
  if (after) {
    frag.appendChild(document.createTextNode(after));
  }
  const wrapper = document.createElement("span");
  wrapper.appendChild(frag);
  return wrapper;
}

async function appendAttachment(parent, msg, scope, passphrase) {
  if (!msg.attachment) {
    return;
  }
  const wrap = document.createElement("div");
  wrap.className = "message-attachment";

  if (msg.attachment.encrypted && msg.attachment.iv && passphrase) {
    try {
      const res = await fetch(HMConnection.resolveAssetUrl(msg.attachment.url));
      const blob = await res.blob();
      const plain = await CryptoHelper.decryptBlob(
        blob,
        msg.attachment.iv,
        passphrase,
        scope
      );
      if (!plain) {
        wrap.textContent = "🔒 Could not decrypt file";
        parent.appendChild(wrap);
        return;
      }
      if ((msg.attachment.mime || "").startsWith("image/")) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(plain);
        img.alt = msg.attachment.name;
        wrap.appendChild(img);
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(plain);
        link.download = msg.attachment.name;
        link.textContent = `📎 ${msg.attachment.name}`;
        wrap.appendChild(link);
      }
    } catch (error) {
      wrap.textContent = "🔒 Could not load encrypted file";
    }
  } else if ((msg.attachment.mime || "").startsWith("image/")) {
    const img = document.createElement("img");
    img.src = HMConnection.resolveAssetUrl(msg.attachment.url);
    img.alt = msg.attachment.name;
    wrap.appendChild(img);
  } else {
    const link = document.createElement("a");
    link.href = HMConnection.resolveAssetUrl(msg.attachment.url);
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = `📎 ${msg.attachment.name}`;
    wrap.appendChild(link);
  }
  parent.appendChild(wrap);
}

async function renderCurrentView() {
  const stickToBottom =
    messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 100;
  messagesEl.innerHTML = "";
  let visibleCount = 0;

  if (chatMode === "dm" && activeDmPartner) {
    const thread = getDmThread(activeDmPartner);
    const filtered = thread.filter(messageMatchesSearch);

    if (thread.length === 0) {
      messagesEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true">🔒</span>
          <p>Private chat with ${activeDmPartner}</p>
          <span class="empty-sub">Only you two can see messages here. Use a shared DM passphrase to encrypt.</span>
        </div>`;
      return;
    }

    if (filtered.length === 0) {
      messagesEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true">🔍</span>
          <p>No messages match "${searchQuery}"</p>
          <span class="empty-sub">Try a different search term.</span>
        </div>`;
      return;
    }

    const dmScope = CryptoHelper.dmScope(myName, activeDmPartner);
    const dmPass = getDmPassphrase(activeDmPartner);
    for (const msg of filtered) {
      messagesEl.appendChild(await buildDmMessageEl(msg, dmScope, dmPass));
      visibleCount += 1;
    }
  } else {
    const store = getChannelStore(activeRoom, activeChannel);
    if (store.length === 0) {
      messagesEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true">💬</span>
          <p>#${activeChannel}</p>
          <span class="empty-sub">Say hello in this channel!</span>
        </div>`;
      return;
    }

    const scope = CryptoHelper.roomScope(activeRoom);
    const pass = getRoomPassphrase(activeRoom);

    for (const msg of store) {
      if (msg.type === "system") {
        if (!searchQuery || (msg.text || "").toLowerCase().includes(searchQuery)) {
          messagesEl.appendChild(buildSystemMessageEl(msg.text));
          visibleCount += 1;
        }
        continue;
      }
      if (!messageMatchesSearch(msg)) {
        continue;
      }
      messagesEl.appendChild(await buildChatMessageEl(msg, scope, pass));
      visibleCount += 1;
    }

    if (visibleCount === 0) {
      messagesEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true">🔍</span>
          <p>No messages match "${searchQuery}"</p>
          <span class="empty-sub">Try a different search term.</span>
        </div>`;
      return;
    }
  }

  if (stickToBottom) {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

function buildMessageActions(msg, isDm) {
  const actions = document.createElement("div");
  actions.className = "message-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "msg-action-btn";
  editBtn.textContent = "Edit";
  editBtn.title = "Edit message";
  editBtn.addEventListener("click", function () {
    const next = prompt("Edit your message:", msg.text);
    if (next === null) {
      return;
    }
    const trimmed = next.trim();
    if (!trimmed || trimmed === msg.text) {
      return;
    }
    const payload = { id: msg.id, text: trimmed };
    if (isDm) {
      payload.dmTo = activeDmPartner;
    }
    socket.emit("edit message", payload);
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "msg-action-btn danger";
  deleteBtn.textContent = "Delete";
  deleteBtn.title = "Delete message";
  deleteBtn.addEventListener("click", function () {
    if (!confirm("Delete this message?")) {
      return;
    }
    const payload = { id: msg.id };
    if (isDm) {
      payload.dmTo = activeDmPartner;
    }
    socket.emit("delete message", payload);
  });

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  return actions;
}

async function buildChatMessageEl(msg, scope, passphrase) {
  const messageEl = document.createElement("article");
  messageEl.className = "message";
  if (msg.id) {
    messageEl.dataset.id = msg.id;
  }
  if (msg.name === myName) {
    messageEl.classList.add("own");
  }

  const headerEl = document.createElement("div");
  headerEl.className = "message-header";

  const avatarEl = document.createElement("span");
  avatarEl.className = "msg-avatar";
  avatarEl.textContent = getAvatarFor(msg.name);

  const metaEl = document.createElement("div");
  metaEl.className = "meta";

  const authorEl = document.createElement("span");
  authorEl.className = "author";
  authorEl.textContent = msg.name === myName ? "You" : msg.name;
  if (msg.encrypted) {
    const lock = document.createElement("span");
    lock.className = "encrypted-badge";
    lock.textContent = "🔐";
    authorEl.appendChild(lock);
  }

  const timeEl = document.createElement("time");
  timeEl.className = "time";
  timeEl.textContent = formatTime(msg.time);
  if (msg.edited) {
    timeEl.textContent += " · edited";
  }

  metaEl.appendChild(authorEl);
  metaEl.appendChild(timeEl);

  headerEl.appendChild(avatarEl);
  headerEl.appendChild(metaEl);

  const textEl = document.createElement("p");
  textEl.className = "text";
  const displayText = await decryptMessageContent(msg, scope, passphrase);
  textEl.appendChild(highlightText(displayText));

  messageEl.appendChild(headerEl);
  messageEl.appendChild(textEl);
  await appendAttachment(messageEl, msg, scope, passphrase);

  if (msg.name === myName && msg.id && !msg.encrypted) {
    messageEl.appendChild(buildMessageActions(msg, false));
  }

  return messageEl;
}

async function buildDmMessageEl(msg, scope, passphrase) {
  const isOwn = msg.from === myName;
  const messageEl = document.createElement("article");
  messageEl.className = "message dm";
  if (msg.id) {
    messageEl.dataset.id = msg.id;
  }
  if (isOwn) {
    messageEl.classList.add("own");
  }

  const headerEl = document.createElement("div");
  headerEl.className = "message-header";

  const avatarEl = document.createElement("span");
  avatarEl.className = "msg-avatar";
  avatarEl.textContent = getAvatarFor(msg.from);

  const metaEl = document.createElement("div");
  metaEl.className = "meta";

  const authorEl = document.createElement("span");
  authorEl.className = "author";
  authorEl.textContent = isOwn ? "You" : msg.from;
  if (msg.encrypted) {
    const lock = document.createElement("span");
    lock.className = "encrypted-badge";
    lock.textContent = "🔐";
    authorEl.appendChild(lock);
  }

  const timeEl = document.createElement("time");
  timeEl.className = "time";
  timeEl.textContent = formatTime(msg.time);
  if (msg.edited) {
    timeEl.textContent += " · edited";
  }

  metaEl.appendChild(authorEl);
  metaEl.appendChild(timeEl);

  headerEl.appendChild(avatarEl);
  headerEl.appendChild(metaEl);

  const textEl = document.createElement("p");
  textEl.className = "text";
  const displayText = await decryptMessageContent(msg, scope, passphrase);
  textEl.appendChild(highlightText(displayText));

  messageEl.appendChild(headerEl);
  messageEl.appendChild(textEl);
  await appendAttachment(messageEl, msg, scope, passphrase);

  if (isOwn && msg.id && !msg.encrypted) {
    messageEl.appendChild(buildMessageActions(msg, true));
  }

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
  messageEl.appendChild(highlightText(text));
  return messageEl;
}

window.HMOnReconnect = function () {
  if (!hasJoined || !myName || !socket) {
    return;
  }
  socket.emit("join", { name: myName, avatar: myAvatar });
  if (chatMode === "channel") {
    socket.emit("join channel", { room: activeRoom, channel: activeChannel });
  }
};

window.HMRefreshChat = function () {
  if (!socket || !hasJoined) {
    return;
  }
  if (chatMode === "channel") {
    socket.emit("join channel", { room: activeRoom, channel: activeChannel });
  } else {
    renderCurrentView();
  }
};

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const MAX_CHANNEL = 200;
const MAX_DM_PER_THREAD = 100;
const DEFAULT_CHANNEL = "main:general";

const store = {
  channels: {},
  dms: {},
  rooms: {
    main: {
      name: "Main Room",
      channels: ["general", "random", "media"],
      encrypted: false,
    },
  },
};

let saveTimer = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function makeId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function channelKey(room, channel) {
  return `${room}:${channel}`;
}

function parseChannelKey(key) {
  const idx = key.indexOf(":");
  if (idx === -1) {
    return { room: "main", channel: "general" };
  }
  return { room: key.slice(0, idx), channel: key.slice(idx + 1) };
}

function ensureChannel(key) {
  if (!store.channels[key]) {
    store.channels[key] = [];
  }
}

function migrateLegacy(data) {
  if (Array.isArray(data.group) && data.group.length > 0) {
    store.channels[DEFAULT_CHANNEL] = data.group.slice(-MAX_CHANNEL);
  }
  if (data.channels && typeof data.channels === "object") {
    store.channels = data.channels;
  }
  if (data.dms && typeof data.dms === "object") {
    store.dms = data.dms;
  }
  if (data.rooms && typeof data.rooms === "object") {
    store.rooms = data.rooms;
  }
  ensureChannel(DEFAULT_CHANNEL);
}

function load() {
  ensureDataDir();
  if (!fs.existsSync(HISTORY_FILE)) {
    ensureChannel(DEFAULT_CHANNEL);
    return;
  }

  try {
    const raw = fs.readFileSync(HISTORY_FILE, "utf8");
    const data = JSON.parse(raw);
    migrateLegacy(data);
  } catch (error) {
    console.warn("Could not load message history, starting fresh.");
    ensureChannel(DEFAULT_CHANNEL);
  }
}

function scheduleSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(function () {
    ensureDataDir();
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(store, null, 2), "utf8");
  }, 400);
}

function dmKey(nameA, nameB) {
  return [nameA, nameB].sort().join("::");
}

function buildChatEntry(message) {
  const entry = {
    id: makeId(),
    type: "chat",
    name: message.name,
    text: message.text || "",
    time: message.time,
    edited: false,
    encrypted: Boolean(message.encrypted),
    ciphertext: message.ciphertext || null,
    iv: message.iv || null,
  };
  if (message.attachment) {
    entry.attachment = message.attachment;
  }
  return entry;
}

function addChannelChat(room, channel, message) {
  const key = channelKey(room, channel);
  ensureChannel(key);
  const entry = buildChatEntry(message);
  store.channels[key].push(entry);
  if (store.channels[key].length > MAX_CHANNEL) {
    store.channels[key] = store.channels[key].slice(-MAX_CHANNEL);
  }
  scheduleSave();
  return entry;
}

function addChannelSystem(room, channel, text) {
  const key = channelKey(room, channel);
  ensureChannel(key);
  const entry = {
    id: makeId(),
    type: "system",
    text,
    time: new Date().toISOString(),
  };
  store.channels[key].push(entry);
  if (store.channels[key].length > MAX_CHANNEL) {
    store.channels[key] = store.channels[key].slice(-MAX_CHANNEL);
  }
  scheduleSave();
  return entry;
}

function addDmMessage(payload) {
  const key = dmKey(payload.from, payload.to);
  if (!store.dms[key]) {
    store.dms[key] = [];
  }

  const entry = {
    id: makeId(),
    from: payload.from,
    to: payload.to,
    text: payload.text || "",
    time: payload.time,
    edited: false,
    encrypted: Boolean(payload.encrypted),
    ciphertext: payload.ciphertext || null,
    iv: payload.iv || null,
  };
  if (payload.attachment) {
    entry.attachment = payload.attachment;
  }

  store.dms[key].push(entry);

  if (store.dms[key].length > MAX_DM_PER_THREAD) {
    store.dms[key] = store.dms[key].slice(-MAX_DM_PER_THREAD);
  }
  scheduleSave();
  return entry;
}

function findChannelMessage(room, channel, id) {
  const key = channelKey(room, channel);
  const list = store.channels[key] || [];
  return list.find((m) => m.id === id);
}

function findDmMessage(id, userName) {
  for (const [key, messages] of Object.entries(store.dms)) {
    const [a, b] = key.split("::");
    if (a !== userName && b !== userName) {
      continue;
    }
    const found = messages.find((m) => m.id === id);
    if (found) {
      return { key, message: found };
    }
  }
  return null;
}

function editChannelMessage(room, channel, id, userName, updates) {
  const msg = findChannelMessage(room, channel, id);
  if (!msg || msg.type !== "chat" || msg.name !== userName) {
    return null;
  }
  if (updates.text !== undefined) {
    msg.text = updates.text;
  }
  if (updates.encrypted !== undefined) {
    msg.encrypted = updates.encrypted;
    msg.ciphertext = updates.ciphertext || null;
    msg.iv = updates.iv || null;
  }
  msg.edited = true;
  scheduleSave();
  return msg;
}

function deleteChannelMessage(room, channel, id, userName) {
  const key = channelKey(room, channel);
  const list = store.channels[key] || [];
  const index = list.findIndex((m) => m.id === id);
  if (index === -1) {
    return null;
  }
  const msg = list[index];
  if (msg.type !== "chat" || msg.name !== userName) {
    return null;
  }
  list.splice(index, 1);
  scheduleSave();
  return msg;
}

function editDmMessage(id, userName, updates) {
  const result = findDmMessage(id, userName);
  if (!result || result.message.from !== userName) {
    return null;
  }
  if (updates.text !== undefined) {
    result.message.text = updates.text;
  }
  if (updates.encrypted !== undefined) {
    result.message.encrypted = updates.encrypted;
    result.message.ciphertext = updates.ciphertext || null;
    result.message.iv = updates.iv || null;
  }
  result.message.edited = true;
  scheduleSave();
  return result.message;
}

function deleteDmMessage(id, userName) {
  for (const [key, messages] of Object.entries(store.dms)) {
    const [a, b] = key.split("::");
    if (a !== userName && b !== userName) {
      continue;
    }
    const index = messages.findIndex((m) => m.id === id);
    if (index === -1) {
      continue;
    }
    const msg = messages[index];
    if (msg.from !== userName) {
      return null;
    }
    messages.splice(index, 1);
    scheduleSave();
    return msg;
  }
  return null;
}

function getChannelMessages(room, channel) {
  const key = channelKey(room, channel);
  return store.channels[key] || [];
}

function getDmThreadsForUser(name) {
  const threads = {};

  for (const [key, messages] of Object.entries(store.dms)) {
    const [a, b] = key.split("::");
    if (a === name || b === name) {
      const partner = a === name ? b : a;
      threads[partner] = messages;
    }
  }

  return threads;
}

function getRooms() {
  return store.rooms;
}

function createRoom(roomId, name, encrypted) {
  const id = roomId.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
  if (!id || store.rooms[id]) {
    return null;
  }
  store.rooms[id] = {
    name: name.trim().slice(0, 48) || id,
    channels: ["general"],
    encrypted: Boolean(encrypted),
  };
  ensureChannel(channelKey(id, "general"));
  scheduleSave();
  return store.rooms[id];
}

function createChannel(roomId, channelName) {
  const room = store.rooms[roomId];
  if (!room) {
    return null;
  }
  const ch = channelName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
  if (!ch || room.channels.includes(ch)) {
    return null;
  }
  room.channels.push(ch);
  ensureChannel(channelKey(roomId, ch));
  scheduleSave();
  return ch;
}

// Legacy aliases for gradual migration
function addGroupChat(message) {
  return addChannelChat("main", "general", message);
}

function addGroupSystem(text) {
  return addChannelSystem("main", "general", text);
}

function getGroupMessages() {
  return getChannelMessages("main", "general");
}

function editGroupMessage(id, userName, newText) {
  return editChannelMessage("main", "general", id, userName, { text: newText });
}

function deleteGroupMessage(id, userName) {
  return deleteChannelMessage("main", "general", id, userName);
}

load();

module.exports = {
  channelKey,
  parseChannelKey,
  addChannelChat,
  addChannelSystem,
  addDmMessage,
  editChannelMessage,
  deleteChannelMessage,
  editDmMessage,
  deleteDmMessage,
  getChannelMessages,
  getDmThreadsForUser,
  getRooms,
  createRoom,
  createChannel,
  addGroupChat,
  addGroupSystem,
  getGroupMessages,
  editGroupMessage,
  deleteGroupMessage,
};

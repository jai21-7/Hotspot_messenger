const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const MAX_GROUP = 200;
const MAX_DM_PER_THREAD = 100;

const store = {
  group: [],
  dms: {},
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

function load() {
  ensureDataDir();
  if (!fs.existsSync(HISTORY_FILE)) {
    return;
  }

  try {
    const raw = fs.readFileSync(HISTORY_FILE, "utf8");
    const data = JSON.parse(raw);
    store.group = Array.isArray(data.group) ? data.group.slice(-MAX_GROUP) : [];
    store.dms = data.dms && typeof data.dms === "object" ? data.dms : {};
  } catch (error) {
    console.warn("Could not load message history, starting fresh.");
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

function addGroupChat(message) {
  const entry = {
    id: makeId(),
    type: "chat",
    name: message.name,
    text: message.text,
    time: message.time,
    edited: false,
  };
  store.group.push(entry);
  if (store.group.length > MAX_GROUP) {
    store.group = store.group.slice(-MAX_GROUP);
  }
  scheduleSave();
  return entry;
}

function addGroupSystem(text) {
  const entry = {
    id: makeId(),
    type: "system",
    text,
    time: new Date().toISOString(),
  };
  store.group.push(entry);
  if (store.group.length > MAX_GROUP) {
    store.group = store.group.slice(-MAX_GROUP);
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
    text: payload.text,
    time: payload.time,
    edited: false,
  };

  store.dms[key].push(entry);

  if (store.dms[key].length > MAX_DM_PER_THREAD) {
    store.dms[key] = store.dms[key].slice(-MAX_DM_PER_THREAD);
  }
  scheduleSave();
  return entry;
}

function findGroupMessage(id) {
  return store.group.find((m) => m.id === id);
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

function editGroupMessage(id, userName, newText) {
  const msg = findGroupMessage(id);
  if (!msg || msg.type !== "chat" || msg.name !== userName) {
    return null;
  }
  msg.text = newText;
  msg.edited = true;
  scheduleSave();
  return msg;
}

function deleteGroupMessage(id, userName) {
  const index = store.group.findIndex((m) => m.id === id);
  if (index === -1) {
    return null;
  }
  const msg = store.group[index];
  if (msg.type !== "chat" || msg.name !== userName) {
    return null;
  }
  store.group.splice(index, 1);
  scheduleSave();
  return msg;
}

function editDmMessage(id, userName, newText) {
  const result = findDmMessage(id, userName);
  if (!result || result.message.from !== userName) {
    return null;
  }
  result.message.text = newText;
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

function getGroupMessages() {
  return store.group;
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

load();

module.exports = {
  addGroupChat,
  addGroupSystem,
  addDmMessage,
  editGroupMessage,
  deleteGroupMessage,
  editDmMessage,
  deleteDmMessage,
  getGroupMessages,
  getDmThreadsForUser,
};

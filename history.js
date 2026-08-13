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
  store.group.push({
    type: "chat",
    name: message.name,
    text: message.text,
    time: message.time,
  });
  if (store.group.length > MAX_GROUP) {
    store.group = store.group.slice(-MAX_GROUP);
  }
  scheduleSave();
}

function addGroupSystem(text) {
  const entry = {
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

  store.dms[key].push({
    from: payload.from,
    to: payload.to,
    text: payload.text,
    time: payload.time,
  });

  if (store.dms[key].length > MAX_DM_PER_THREAD) {
    store.dms[key] = store.dms[key].slice(-MAX_DM_PER_THREAD);
  }
  scheduleSave();
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
  getGroupMessages,
  getDmThreadsForUser,
};

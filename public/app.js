// Connect to the Socket.io server (same computer/hotspot host)
const socket = io();

// Find the important pieces of the page
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

let hasJoined = false;
let myName = "";

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Show a link friends can open on the same hotspot
async function loadJoinInfo() {
  try {
    const response = await fetch("/api/join-info");
    const data = await response.json();

    if (!data.urls || data.urls.length === 0) {
      joinUrlEl.textContent =
        "Connect to Wi‑Fi/hotspot, restart the server, then refresh.";
      return;
    }

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

  socket.emit("chat message", { text });
  messageInput.value = "";
  messageInput.focus();
});

socket.on("chat message", function (data) {
  addMessage(data.name, data.text, data.time);
});

socket.on("system message", function (text) {
  addSystemMessage(text);
});

socket.on("user list", function (names) {
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
    const chip = document.createElement("span");
    chip.className = "user-chip";
    if (name === myName) {
      chip.classList.add("you");
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

function addMessage(name, text, time) {
  clearEmptyState();

  const messageEl = document.createElement("article");
  messageEl.className = "message";
  if (name === myName) {
    messageEl.classList.add("own");
  }

  const metaEl = document.createElement("div");
  metaEl.className = "meta";

  const authorEl = document.createElement("span");
  authorEl.className = "author";
  authorEl.textContent = name === myName ? "You" : name;

  const timeEl = document.createElement("time");
  timeEl.className = "time";
  timeEl.textContent = formatTime(time);

  metaEl.appendChild(authorEl);
  metaEl.appendChild(timeEl);

  const textEl = document.createElement("p");
  textEl.className = "text";
  textEl.textContent = text;

  messageEl.appendChild(metaEl);
  messageEl.appendChild(textEl);
  messagesEl.appendChild(messageEl);

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addSystemMessage(text) {
  clearEmptyState();

  const messageEl = document.createElement("article");
  messageEl.className = "message system";
  messageEl.textContent = text;
  messagesEl.appendChild(messageEl);

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function clearEmptyState() {
  const emptyState = messagesEl.querySelector(".empty-state");
  if (emptyState) {
    emptyState.remove();
  }
}

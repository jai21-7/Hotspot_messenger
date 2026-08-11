// Connect to the Socket.io server (same computer/hotspot host)
const socket = io();

// Find the important pieces of the page
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const displayNameInput = document.getElementById("display-name");
const joinButton = document.getElementById("join-button");
const joinHint = document.getElementById("join-hint");
const onlineListEl = document.getElementById("online-list");
const messagesEl = document.getElementById("messages");
const sendButton = document.getElementById("send-button");

let hasJoined = false;

function joinChat() {
  const name = displayNameInput.value.trim();
  if (!name) {
    displayNameInput.focus();
    alert("Please enter your name first.");
    return;
  }

  // Tell the server our display name
  socket.emit("join", name);

  hasJoined = true;
  displayNameInput.disabled = true;
  joinButton.disabled = true;
  messageInput.disabled = false;
  sendButton.disabled = false;
  messageInput.placeholder = "Type a message...";
  joinHint.textContent = `Joined as ${name}`;
  messageInput.focus();
}

joinButton.addEventListener("click", joinChat);

// Press Enter in the name box to join
displayNameInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    joinChat();
  }
});

// When the user clicks Send (or presses Enter), run this function
chatForm.addEventListener("submit", function (event) {
  // Stop the browser from reloading the page (default form behavior)
  event.preventDefault();

  if (!hasJoined) {
    alert("Please join with a name first.");
    displayNameInput.focus();
    return;
  }

  const text = messageInput.value.trim();

  // Don't send empty messages
  if (!text) {
    messageInput.focus();
    return;
  }

  // Server already knows our name from the join step
  socket.emit("chat message", { text });

  // Clear the box and focus it again for the next message
  messageInput.value = "";
  messageInput.focus();
});

// When the server sends a chat message, show it on the page
socket.on("chat message", function (data) {
  addMessage(data.name, data.text);
});

// System notes like "Alex joined the chat"
socket.on("system message", function (text) {
  addSystemMessage(text);
});

// Update the Online list whenever the server sends it
socket.on("user list", function (names) {
  if (!Array.isArray(names) || names.length === 0) {
    onlineListEl.textContent = "Nobody online yet";
    return;
  }
  onlineListEl.textContent = names.join(", ");
});

function addMessage(name, text) {
  clearEmptyState();

  const messageEl = document.createElement("article");
  messageEl.className = "message";

  const authorEl = document.createElement("span");
  authorEl.className = "author";
  authorEl.textContent = name;

  const textEl = document.createElement("p");
  textEl.className = "text";
  textEl.textContent = text;

  messageEl.appendChild(authorEl);
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

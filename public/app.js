// Find the important pieces of the page
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const displayNameInput = document.getElementById("display-name");
const messagesEl = document.getElementById("messages");

// When the user clicks Send (or presses Enter), run this function
chatForm.addEventListener("submit", function (event) {
  // Stop the browser from reloading the page (default form behavior)
  event.preventDefault();

  const name = displayNameInput.value.trim() || "Anonymous";
  const text = messageInput.value.trim();

  // For now, still allow empty checks in the next small commit;
  // ignore blank messages so we don't add empty bubbles
  if (!text) {
    return;
  }

  addMessage(name, text);

  // Clear the box and focus it again for the next message
  messageInput.value = "";
  messageInput.focus();
});

function addMessage(name, text) {
  // Remove the "No messages yet" hint the first time we send
  const emptyState = messagesEl.querySelector(".empty-state");
  if (emptyState) {
    emptyState.remove();
  }

  // Build one message bubble in the page
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

  // Scroll so the newest message is visible
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

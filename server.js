const express = require("express");
const http = require("http");
const os = require("os");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// socket.id -> display name for everyone who has joined
const users = new Map();

function getOnlineNames() {
  return Array.from(users.values());
}

// Find local network IPs so phones can open the chat
function getLanAddresses() {
  const nets = os.networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Skip internal (localhost) and non-IPv4 addresses
      const isIPv4 = net.family === "IPv4" || net.family === 4;
      if (isIPv4 && !net.internal) {
        results.push(net.address);
      }
    }
  }

  return results;
}

// Serve files from the "public" folder (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// Small API so the page can show "open this URL on your phone"
app.get("/api/join-info", (req, res) => {
  const addresses = getLanAddresses();
  res.json({
    port: PORT,
    urls: addresses.map((ip) => `http://${ip}:${PORT}`),
  });
});

// When a browser connects, we get a socket for that user
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Send the current online list to the new visitor right away
  socket.emit("user list", getOnlineNames());

  // User picks a display name and joins the chat
  socket.on("join", (rawName) => {
    if (typeof rawName !== "string") {
      return;
    }

    const name = rawName.trim().slice(0, 24);
    if (!name) {
      return;
    }

    // If they reconnect/rejoin, update their name
    const isNew = !users.has(socket.id);
    users.set(socket.id, name);

    // Tell everyone the updated online list
    io.emit("user list", getOnlineNames());

    if (isNew) {
      io.emit("system message", `${name} joined the chat`);
    }
  });

  // Listen for chat messages from this user
  socket.on("chat message", (data) => {
    const name = users.get(socket.id);
    if (!name) {
      // Must join with a name before chatting
      return;
    }

    if (!data || typeof data.text !== "string") {
      return;
    }

    const text = data.text.trim().slice(0, 500);
    if (!text) {
      return;
    }

    // Send the message to EVERY connected browser (including the sender)
    // Use the server-known name so clients can't fake another identity easily
    io.emit("chat message", {
      name,
      text,
      time: new Date().toISOString(),
    });
  });

  socket.on("disconnect", () => {
    const name = users.get(socket.id);
    if (name) {
      users.delete(socket.id);
      io.emit("user list", getOnlineNames());
      io.emit("system message", `${name} left the chat`);
    }
    console.log("A user disconnected:", socket.id);
  });
});

// Listen on 0.0.0.0 so phones on the same hotspot can connect
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Hotspot Messenger running at http://localhost:${PORT}`);

  const addresses = getLanAddresses();
  if (addresses.length === 0) {
    console.log("No LAN IP found yet. Connect to Wi‑Fi/hotspot, then restart.");
  } else {
    console.log("On another device, open:");
    for (const ip of addresses) {
      console.log(`  http://${ip}:${PORT}`);
    }
  }
});

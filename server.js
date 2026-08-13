const express = require("express");
const http = require("http");
const os = require("os");
const path = require("path");
const { Server } = require("socket.io");
const history = require("./history");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// socket.id -> display name for everyone who has joined
const users = new Map();

function getOnlineNames() {
  return Array.from(users.values());
}

// Find every socket connected with a given display name
function getSocketIdsByName(name) {
  const ids = [];
  for (const [socketId, userName] of users) {
    if (userName === name) {
      ids.push(socketId);
    }
  }
  return ids;
}

// Find local network IPs so phones can open the chat
function getLanAddresses() {
  const nets = os.networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const isIPv4 = net.family === "IPv4" || net.family === 4;
      if (isIPv4 && !net.internal) {
        results.push(net.address);
      }
    }
  }

  return results;
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/join-info", (req, res) => {
  const addresses = getLanAddresses();
  res.json({
    port: PORT,
    urls: addresses.map((ip) => `http://${ip}:${PORT}`),
  });
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.emit("user list", getOnlineNames());

  socket.on("join", (rawName) => {
    if (typeof rawName !== "string") {
      return;
    }

    const name = rawName.trim().slice(0, 24);
    if (!name) {
      return;
    }

    const isNew = !users.has(socket.id);
    users.set(socket.id, name);

    io.emit("user list", getOnlineNames());

    // Send stored messages to this user (shared across all devices)
    socket.emit("chat history", { messages: history.getGroupMessages() });
    socket.emit("dm history", { threads: history.getDmThreadsForUser(name) });

    if (isNew) {
      const joinText = `${name} joined the chat`;
      history.addGroupSystem(joinText);
      io.emit("system message", joinText);
    }
  });

  socket.on("chat message", (data) => {
    const name = users.get(socket.id);
    if (!name) {
      return;
    }

    if (!data || typeof data.text !== "string") {
      return;
    }

    const text = data.text.trim().slice(0, 500);
    if (!text) {
      return;
    }

    const payload = {
      name,
      text,
      time: new Date().toISOString(),
    };

    history.addGroupChat(payload);
    io.emit("chat message", payload);
  });

  socket.on("dm message", (data) => {
    const from = users.get(socket.id);
    if (!from) {
      return;
    }

    if (!data || typeof data.to !== "string" || typeof data.text !== "string") {
      return;
    }

    const to = data.to.trim().slice(0, 24);
    const text = data.text.trim().slice(0, 500);
    if (!to || !text) {
      return;
    }

    if (to === from) {
      socket.emit("dm error", { message: "You cannot message yourself." });
      return;
    }

    const recipientIds = getSocketIdsByName(to);
    if (recipientIds.length === 0) {
      socket.emit("dm error", { message: `${to} is not online.` });
      return;
    }

    const payload = {
      from,
      to,
      text,
      time: new Date().toISOString(),
    };

    history.addDmMessage(payload);

    socket.emit("dm message", payload);
    for (const id of recipientIds) {
      if (id !== socket.id) {
        io.to(id).emit("dm message", payload);
      }
    }
  });

  socket.on("typing", (data) => {
    const name = users.get(socket.id);
    if (!name) {
      return;
    }

    const isTyping = Boolean(data && data.typing);
    const to = data && typeof data.to === "string" ? data.to.trim().slice(0, 24) : null;

    if (to) {
      const recipientIds = getSocketIdsByName(to);
      for (const id of recipientIds) {
        io.to(id).emit("typing", { name, typing: isTyping, dm: true });
      }
      return;
    }

    socket.broadcast.emit("typing", { name, typing: isTyping });
  });

  socket.on("disconnect", () => {
    const name = users.get(socket.id);
    if (name) {
      users.delete(socket.id);
      io.emit("user list", getOnlineNames());

      const leaveText = `${name} left the chat`;
      history.addGroupSystem(leaveText);
      io.emit("system message", leaveText);

      socket.broadcast.emit("typing", { name, typing: false });
    }
    console.log("A user disconnected:", socket.id);
  });
});

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

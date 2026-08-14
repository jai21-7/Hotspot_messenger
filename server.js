const express = require("express");
const http = require("http");
const os = require("os");
const path = require("path");
const QRCode = require("qrcode");
const { Server } = require("socket.io");
const history = require("./history");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// socket.id -> display name
const users = new Map();
// display name -> avatar emoji
const userAvatars = new Map();

const AVATAR_OPTIONS = ["😀", "🦊", "🐼", "🐯", "🦁", "🐸", "🐙", "🦄", "🐲", "🎮", "⚡", "🌟"];

function getOnlineUsers() {
  const names = Array.from(users.values());
  const unique = [...new Set(names)];
  return unique.map((name) => ({
    name,
    avatar: userAvatars.get(name) || "😀",
  }));
}

function getSocketIdsByName(name) {
  const ids = [];
  for (const [socketId, userName] of users) {
    if (userName === name) {
      ids.push(socketId);
    }
  }
  return ids;
}

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

function parseJoinPayload(raw) {
  if (typeof raw === "string") {
    return { name: raw, avatar: "😀" };
  }
  if (raw && typeof raw === "object") {
    return {
      name: typeof raw.name === "string" ? raw.name : "",
      avatar: typeof raw.avatar === "string" ? raw.avatar : "😀",
    };
  }
  return { name: "", avatar: "😀" };
}

function isValidAvatar(avatar) {
  return AVATAR_OPTIONS.includes(avatar);
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/join-info", (req, res) => {
  const addresses = getLanAddresses();
  res.json({
    port: PORT,
    urls: addresses.map((ip) => `http://${ip}:${PORT}`),
    avatars: AVATAR_OPTIONS,
  });
});

app.get("/api/qr", async (req, res) => {
  const url = typeof req.query.url === "string" ? req.query.url.trim() : "";
  if (!url || !url.startsWith("http")) {
    return res.status(400).send("Invalid url");
  }
  try {
    const png = await QRCode.toBuffer(url, { width: 220, margin: 1 });
    res.type("png").send(png);
  } catch (error) {
    res.status(500).send("Could not generate QR code");
  }
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.emit("user list", getOnlineUsers());

  socket.on("join", (rawPayload) => {
    const { name: rawName, avatar: rawAvatar } = parseJoinPayload(rawPayload);
    const name = rawName.trim().slice(0, 24);
    if (!name) {
      return;
    }

    const avatar = isValidAvatar(rawAvatar) ? rawAvatar : "😀";
    const isNew = !users.has(socket.id);

    users.set(socket.id, name);
    userAvatars.set(name, avatar);

    io.emit("user list", getOnlineUsers());

    socket.emit("chat history", { messages: history.getGroupMessages() });
    socket.emit("dm history", { threads: history.getDmThreadsForUser(name) });

    if (isNew) {
      const joinText = `${avatar} ${name} joined the chat`;
      history.addGroupSystem(joinText);
      io.emit("system message", joinText);
    }
  });

  socket.on("chat message", (data) => {
    const name = users.get(socket.id);
    if (!name || !data || typeof data.text !== "string") {
      return;
    }

    const text = data.text.trim().slice(0, 500);
    if (!text) {
      return;
    }

    const entry = history.addGroupChat({
      name,
      text,
      time: new Date().toISOString(),
    });

    io.emit("chat message", {
      id: entry.id,
      name: entry.name,
      text: entry.text,
      time: entry.time,
      edited: false,
    });
  });

  socket.on("dm message", (data) => {
    const from = users.get(socket.id);
    if (!from || !data || typeof data.to !== "string" || typeof data.text !== "string") {
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

    const entry = history.addDmMessage({
      from,
      to,
      text,
      time: new Date().toISOString(),
    });

    const payload = {
      id: entry.id,
      from: entry.from,
      to: entry.to,
      text: entry.text,
      time: entry.time,
      edited: false,
    };

    socket.emit("dm message", payload);
    for (const id of recipientIds) {
      if (id !== socket.id) {
        io.to(id).emit("dm message", payload);
      }
    }
  });

  socket.on("edit message", (data) => {
    const name = users.get(socket.id);
    if (!name || !data || typeof data.id !== "string" || typeof data.text !== "string") {
      return;
    }

    const text = data.text.trim().slice(0, 500);
    if (!text) {
      return;
    }

    const dmTo = data.dmTo ? data.dmTo.trim().slice(0, 24) : null;

    if (dmTo) {
      const updated = history.editDmMessage(data.id, name, text);
      if (!updated) {
        return;
      }
      const payload = {
        id: updated.id,
        from: updated.from,
        to: updated.to,
        text: updated.text,
        time: updated.time,
        edited: true,
        dm: true,
      };
      const recipientIds = getSocketIdsByName(updated.to);
      socket.emit("message updated", payload);
      for (const id of recipientIds) {
        if (id !== socket.id) {
          io.to(id).emit("message updated", payload);
        }
      }
      return;
    }

    const updated = history.editGroupMessage(data.id, name, text);
    if (!updated) {
      return;
    }

    io.emit("message updated", {
      id: updated.id,
      name: updated.name,
      text: updated.text,
      time: updated.time,
      edited: true,
    });
  });

  socket.on("delete message", (data) => {
    const name = users.get(socket.id);
    if (!name || !data || typeof data.id !== "string") {
      return;
    }

    const dmTo = data.dmTo ? data.dmTo.trim().slice(0, 24) : null;

    if (dmTo) {
      const removed = history.deleteDmMessage(data.id, name);
      if (!removed) {
        return;
      }
      const payload = { id: removed.id, dm: true, from: removed.from, to: removed.to };
      const recipientIds = getSocketIdsByName(removed.to);
      socket.emit("message deleted", payload);
      for (const id of recipientIds) {
        if (id !== socket.id) {
          io.to(id).emit("message deleted", payload);
        }
      }
      return;
    }

    const removed = history.deleteGroupMessage(data.id, name);
    if (!removed) {
      return;
    }

    io.emit("message deleted", { id: removed.id });
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
      const avatar = userAvatars.get(name) || "😀";
      users.delete(socket.id);
      const stillOnline = getSocketIdsByName(name).length > 0;
      if (!stillOnline) {
        userAvatars.delete(name);
      }
      io.emit("user list", getOnlineUsers());

      const leaveText = `${avatar} ${name} left the chat`;
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

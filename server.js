const express = require("express");
const http = require("http");
const os = require("os");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const QRCode = require("qrcode");
const multer = require("multer");
const { Server } = require("socket.io");
const { Bonjour } = require("bonjour-service");
const history = require("./history");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/zip",
]);

const users = new Map();
const userAvatars = new Map();
const socketRooms = new Map();

const AVATAR_OPTIONS = ["😀", "🦊", "🐼", "🐯", "🦁", "🐸", "🐙", "🦄", "🐲", "🎮", "⚡", "🌟"];

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname).slice(0, 12);
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: function (req, file, cb) {
    if (ALLOWED_MIME.has(file.mimetype) || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

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

function socketChannel(socket) {
  return socketRooms.get(socket.id) || { room: "main", channel: "general" };
}

function ioRoom(room, channel) {
  return history.channelKey(room, channel);
}

function emitToChannel(room, channel, event, payload) {
  io.to(ioRoom(room, channel)).emit(event, payload);
}

function messagePayload(entry, room, channel) {
  return {
    id: entry.id,
    name: entry.name,
    text: entry.text,
    time: entry.time,
    edited: Boolean(entry.edited),
    encrypted: Boolean(entry.encrypted),
    ciphertext: entry.ciphertext || null,
    iv: entry.iv || null,
    attachment: entry.attachment || null,
    room,
    channel,
  };
}

function dmPayload(entry) {
  return {
    id: entry.id,
    from: entry.from,
    to: entry.to,
    text: entry.text,
    time: entry.time,
    edited: Boolean(entry.edited),
    encrypted: Boolean(entry.encrypted),
    ciphertext: entry.ciphertext || null,
    iv: entry.iv || null,
    attachment: entry.attachment || null,
  };
}

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));

function getJoinUrls() {
  return getLanAddresses().map((ip) => `http://${ip}:${PORT}`);
}

function buildDeepLink(url) {
  return `hotspot://join?url=${encodeURIComponent(url)}`;
}

app.get("/api/discover", (req, res) => {
  const urls = getJoinUrls();
  const primary = urls[0] || `http://localhost:${PORT}`;
  res.json({
    service: "hotspot-messenger",
    name: "Hotspot Messenger",
    port: PORT,
    urls,
    deepLink: buildDeepLink(primary),
  });
});

app.get("/api/join-info", (req, res) => {
  const urls = getJoinUrls();
  const primary = urls[0] || `http://localhost:${PORT}`;
  res.json({
    port: PORT,
    urls,
    deepLink: buildDeepLink(primary),
    avatars: AVATAR_OPTIONS,
    rooms: history.getRooms(),
    maxFileSize: MAX_FILE_SIZE,
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

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({
    fileId: req.file.filename,
    name: req.file.originalname,
    mime: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
  });
});

app.use(function (error, req, res, next) {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.message });
  }
  if (error) {
    return res.status(400).json({ error: error.message || "Upload failed" });
  }
  next();
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.emit("user list", getOnlineUsers());
  socket.emit("rooms list", history.getRooms());

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

    if (!socketRooms.has(socket.id)) {
      socketRooms.set(socket.id, { room: "main", channel: "general" });
      socket.join(ioRoom("main", "general"));
    }

    const { room, channel } = socketChannel(socket);
    socket.join(ioRoom(room, channel));

    io.emit("user list", getOnlineUsers());

    socket.emit("channel history", {
      room,
      channel,
      messages: history.getChannelMessages(room, channel),
    });
    socket.emit("dm history", { threads: history.getDmThreadsForUser(name) });

    if (isNew) {
      const joinText = `${avatar} ${name} joined ${room} / #${channel}`;
      history.addChannelSystem(room, channel, joinText);
      emitToChannel(room, channel, "channel message", {
        type: "system",
        text: joinText,
        room,
        channel,
      });
    }
  });

  socket.on("join channel", (data) => {
    const name = users.get(socket.id);
    if (!name || !data) {
      return;
    }

    const room = typeof data.room === "string" ? data.room.trim().slice(0, 24) : "main";
    const channel = typeof data.channel === "string" ? data.channel.trim().slice(0, 24) : "general";
    const rooms = history.getRooms();
    if (!rooms[room] || !rooms[room].channels.includes(channel)) {
      return;
    }

    const prev = socketChannel(socket);
    socket.leave(ioRoom(prev.room, prev.channel));

    socketRooms.set(socket.id, { room, channel });
    socket.join(ioRoom(room, channel));

    socket.emit("channel history", {
      room,
      channel,
      messages: history.getChannelMessages(room, channel),
    });
    socket.emit("channel joined", { room, channel, encrypted: Boolean(rooms[room].encrypted) });
  });

  socket.on("create room", (data) => {
    const name = users.get(socket.id);
    if (!name || !data || typeof data.roomId !== "string") {
      return;
    }
    const created = history.createRoom(data.roomId, data.name || data.roomId, Boolean(data.encrypted));
    if (!created) {
      socket.emit("room error", { message: "Could not create room (id may already exist)." });
      return;
    }
    io.emit("rooms list", history.getRooms());
  });

  socket.on("create channel", (data) => {
    const name = users.get(socket.id);
    if (!name || !data || typeof data.room !== "string" || typeof data.channel !== "string") {
      return;
    }
    const ch = history.createChannel(data.room, data.channel);
    if (!ch) {
      socket.emit("room error", { message: "Could not create channel." });
      return;
    }
    io.emit("rooms list", history.getRooms());
  });

  socket.on("chat message", (data) => {
    const name = users.get(socket.id);
    if (!name || !data) {
      return;
    }

    const { room, channel } = socketChannel(socket);
    const hasText = typeof data.text === "string" && data.text.trim();
    const hasEncrypted = data.encrypted && data.ciphertext && data.iv;
    if (!hasText && !hasEncrypted && !data.attachment) {
      return;
    }

    const entry = history.addChannelChat(room, channel, {
      name,
      text: hasText ? data.text.trim().slice(0, 500) : "",
      time: new Date().toISOString(),
      encrypted: Boolean(data.encrypted),
      ciphertext: data.ciphertext || null,
      iv: data.iv || null,
      attachment: data.attachment || null,
    });

    emitToChannel(room, channel, "chat message", messagePayload(entry, room, channel));
  });

  socket.on("dm message", (data) => {
    const from = users.get(socket.id);
    if (!from || !data) {
      return;
    }

    const to = typeof data.to === "string" ? data.to.trim().slice(0, 24) : "";
    const hasText = typeof data.text === "string" && data.text.trim();
    const hasEncrypted = data.encrypted && data.ciphertext && data.iv;
    if (!to || (!hasText && !hasEncrypted && !data.attachment)) {
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
      text: hasText ? data.text.trim().slice(0, 500) : "",
      time: new Date().toISOString(),
      encrypted: Boolean(data.encrypted),
      ciphertext: data.ciphertext || null,
      iv: data.iv || null,
      attachment: data.attachment || null,
    });

    const payload = dmPayload(entry);
    socket.emit("dm message", payload);
    for (const id of recipientIds) {
      if (id !== socket.id) {
        io.to(id).emit("dm message", payload);
      }
    }
  });

  socket.on("edit message", (data) => {
    const name = users.get(socket.id);
    if (!name || !data || typeof data.id !== "string") {
      return;
    }

    const dmTo = data.dmTo ? data.dmTo.trim().slice(0, 24) : null;
    const updates = {};
    if (data.encrypted) {
      updates.encrypted = true;
      updates.ciphertext = data.ciphertext;
      updates.iv = data.iv;
      updates.text = "";
    } else if (typeof data.text === "string") {
      updates.text = data.text.trim().slice(0, 500);
      updates.encrypted = false;
    }

    if (dmTo) {
      const updated = history.editDmMessage(data.id, name, updates);
      if (!updated) {
        return;
      }
      const payload = { ...dmPayload(updated), edited: true, dm: true };
      const recipientIds = getSocketIdsByName(updated.to);
      socket.emit("message updated", payload);
      for (const id of recipientIds) {
        if (id !== socket.id) {
          io.to(id).emit("message updated", payload);
        }
      }
      return;
    }

    const { room, channel } = socketChannel(socket);
    const updated = history.editChannelMessage(room, channel, data.id, name, updates);
    if (!updated) {
      return;
    }

    emitToChannel(room, channel, "message updated", {
      ...messagePayload(updated, room, channel),
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

    const { room, channel } = socketChannel(socket);
    const removed = history.deleteChannelMessage(room, channel, data.id, name);
    if (!removed) {
      return;
    }

    emitToChannel(room, channel, "message deleted", { id: removed.id, room, channel });
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

    const { room, channel } = socketChannel(socket);
    socket.to(ioRoom(room, channel)).emit("typing", { name, typing: isTyping, room, channel });
  });

  socket.on("disconnect", () => {
    const name = users.get(socket.id);
    if (name) {
      const avatar = userAvatars.get(name) || "😀";
      const { room, channel } = socketChannel(socket);
      users.delete(socket.id);
      socketRooms.delete(socket.id);
      const stillOnline = getSocketIdsByName(name).length > 0;
      if (!stillOnline) {
        userAvatars.delete(name);
      }
      io.emit("user list", getOnlineUsers());

      const leaveText = `${avatar} ${name} left the chat`;
      history.addChannelSystem(room, channel, leaveText);
      emitToChannel(room, channel, "channel message", {
        type: "system",
        text: leaveText,
        room,
        channel,
      });

      socket.broadcast.emit("typing", { name, typing: false });
    }
    console.log("A user disconnected:", socket.id);
  });
});

let bonjour = null;

function startMdns() {
  try {
    bonjour = new Bonjour();
    bonjour.publish({
      name: "Hotspot Messenger",
      type: "hotspot-messenger",
      port: PORT,
      txt: { path: "/", app: "hotspot-messenger" },
    });
    console.log(`mDNS: advertising _hotspot-messenger._tcp.local on port ${PORT}`);
  } catch (error) {
    console.warn("mDNS advertisement failed:", error.message);
  }
}

function stopMdns() {
  if (bonjour) {
    bonjour.destroy();
    bonjour = null;
  }
}

process.on("SIGINT", function () {
  stopMdns();
  process.exit(0);
});

process.on("SIGTERM", function () {
  stopMdns();
  process.exit(0);
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

  startMdns();
});

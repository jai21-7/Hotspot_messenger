const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// Serve files from the "public" folder (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// When a browser connects, we get a socket for that user
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Listen for chat messages from this user
  socket.on("chat message", (data) => {
    // Basic safety: only accept objects with name + text strings
    if (!data || typeof data.name !== "string" || typeof data.text !== "string") {
      return;
    }

    const name = data.name.trim().slice(0, 24);
    const text = data.text.trim().slice(0, 500);
    if (!name || !text) {
      return;
    }

    // Send the message to EVERY connected browser (including the sender)
    io.emit("chat message", { name, text });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Listen on 0.0.0.0 so phones on the same hotspot can connect
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Hotspot Messenger running at http://localhost:${PORT}`);
  console.log("On another device, open http://<this-computer-ip>:3000");
});

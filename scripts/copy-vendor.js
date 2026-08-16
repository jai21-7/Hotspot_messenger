// Copy Socket.io browser client into public/ so the APK works without the Node server
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "node_modules", "socket.io", "client-dist", "socket.io.min.js");
const destDir = path.join(__dirname, "..", "public", "vendor");
const dest = path.join(destDir, "socket.io.min.js");

if (!fs.existsSync(src)) {
  console.error("Run npm install first — socket.io client not found.");
  process.exit(1);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(src, dest);
console.log("Copied socket.io.min.js to public/vendor/");

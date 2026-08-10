const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve files from the "public" folder (HTML, CSS, JS later)
app.use(express.static(path.join(__dirname, "public")));

// Listen on 0.0.0.0 so phones on the same hotspot can connect
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Hotspot Messenger running at http://localhost:${PORT}`);
  console.log("On another device, open http://<this-computer-ip>:3000");
});

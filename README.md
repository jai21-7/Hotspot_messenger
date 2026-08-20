# Hotspot Messenger

A simple group chat website that works on a **Wi‑Fi hotspot / local network** — no mobile data or internet required.

## How it works

1. One device runs this app (the **host**).
2. Other phones/laptops join the same hotspot or Wi‑Fi.
3. Everyone opens the host’s local address in a browser (example: `http://192.168.43.1:3000`).
4. Messages stay on the local network only.

## Status

**All learning steps done (1–7).**  
The app supports join/usernames, online presence, live Socket.io chat, timestamps, and a hotspot join link.

## Requirements

- [Node.js](https://nodejs.org/) (LTS recommended)
- Git (optional, for GitHub)

Check your install:

```bash
node -v
npm -v
```

## Install (first time only)

```bash
npm install
```

## Run

```bash
npm start
```

Then open `http://localhost:3000` on the host device.

The page header and the terminal both show join URLs like `http://192.168.x.x:3000` for other phones.

## Hotspot test guide (Windows)

Follow these steps carefully:

1. **Pick a host**  
   Use a laptop/PC that will keep the app running.

2. **Create or join the network**  
   - Option A: turn on the phone’s **Mobile Hotspot**, then connect the host PC to that hotspot.  
   - Option B: connect host + phones to the **same Wi‑Fi router**.

3. **Start the server on the host**
   ```bash
   npm start
   ```
   Leave this terminal open. Closing it stops the chat for everyone.

4. **Find the join link**
   - Look at the terminal output for lines like `http://192.168.43.1:3000`, **or**
   - Look at the green “Friends open: …” line on the chat page, **or**
   - Run `ipconfig` on Windows and find the **IPv4 Address** under Wi‑Fi / Wireless LAN, then open `http://THAT_IP:3000`.

5. **Open on other devices**  
   On each phone/laptop (same hotspot/Wi‑Fi), open that URL in Chrome/Safari/Edge.  
   Mobile data can stay off.

6. **Join and chat**  
   Enter a name → tap **Join** → type messages.  
   You should see online users, join/leave notices, and timestamps.

### Troubleshooting

| Problem | What to try |
|---------|-------------|
| Phone cannot open the page | Same Wi‑Fi/hotspot? Correct IP? Server still running? |
| Windows firewall blocks it | Allow Node.js / port 3000 when Windows asks, or allow inbound TCP 3000 |
| Wrong IP shown | Restart `npm start` after connecting to the hotspot |
| Page loads but chat fails | Hard refresh the page; confirm Socket.io script loads |

## Host on your Android phone (Termux)

You can run the server **on your phone** instead of a laptop. Friends join the same way.

1. Install [Termux](https://f-droid.org/en/packages/com.termux/) from F-Droid
2. Run the setup script: `bash scripts/termux-setup.sh`
3. Start the server: `npm start`
4. Share the URL shown in the terminal

See **[docs/TERMUX-HOST.md](docs/TERMUX-HOST.md)** for the full guide (hotspot mode, tmux, wake lock).

In the app, open **Settings → How to host on phone** for copy-paste commands.

## Play Store release

See **[docs/PLAY-STORE.md](docs/PLAY-STORE.md)** for signing, building the AAB, and publishing to Google Play.

Privacy policy: **[docs/PRIVACY-POLICY.md](docs/PRIVACY-POLICY.md)** (also at `/privacy.html` when the server is running).

## Learning path

| Step | What you learn |
|------|----------------|
| 1 | Project setup, `package.json`, README, `.gitignore` |
| 2 | Express web server, localhost vs LAN IP |
| 3 | HTML/CSS chat layout |
| 4 | Client JavaScript (DOM) |
| 5 | Socket.io realtime chat |
| 6 | Usernames and online users |
| 7 | Hotspot testing guide + polish |

## License

MIT

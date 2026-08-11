# Hotspot Messenger

A simple group chat website that works on a **Wi‑Fi hotspot / local network** — no mobile data or internet required.

## How it works

1. One device runs this app (the **host**).
2. Other phones/laptops join the same hotspot or Wi‑Fi.
3. Everyone opens the host’s local address in a browser (example: `http://192.168.43.1:3000`).
4. Messages stay on the local network only.

## Status

**Step 3 done:** Chat page layout (name field, messages area, send form) with CSS.

Next: client JavaScript (Step 4), then live messaging with Socket.io (Step 5).

## Requirements

- [Node.js](https://nodejs.org/) (LTS recommended)
- Git (optional, for GitHub)

Check your install:

```bash
node -v
npm -v
```

## Run

```bash
npm start
```

Then open `http://localhost:3000` on the host device.

To test from another phone on the same hotspot/Wi‑Fi:

1. On the host (Windows), run `ipconfig` and find the IPv4 address (often like `192.168.43.1` or `192.168.x.x`).
2. On the phone, open `http://THAT_IP:3000` in the browser.

## Learning path

| Step | What you learn |
|------|----------------|
| 1 | Project setup, `package.json`, README, `.gitignore` |
| 2 | Express web server, localhost vs LAN IP |
| 3 | HTML/CSS chat layout |
| 4 | Client JavaScript (DOM) |
| 5 | Socket.io realtime chat |
| 6 | Usernames and online users |
| 7 | Hotspot testing guide |

## License

MIT

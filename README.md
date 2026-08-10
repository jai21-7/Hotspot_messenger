# Hotspot Messenger

A simple group chat website that works on a **Wi‑Fi hotspot / local network** — no mobile data or internet required.

## How it works

1. One device runs this app (the **host**).
2. Other phones/laptops join the same hotspot or Wi‑Fi.
3. Everyone opens the host’s local address in a browser (example: `http://192.168.43.1:3000`).
4. Messages stay on the local network only.

## Status

**Step 1 done:** project skeleton (`package.json`, README, `.gitignore`).

Next steps will add the web server, chat UI, and live messaging with Socket.io.

## Requirements

- [Node.js](https://nodejs.org/) (LTS recommended)
- Git (optional, for GitHub)

Check your install:

```bash
node -v
npm -v
```

## Run (coming soon)

After we add the server in Step 2:

```bash
npm start
```

Then open `http://localhost:3000` on the host device.

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

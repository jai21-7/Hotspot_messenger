# Host Hotspot Messenger on your Android phone (Termux)

Run the chat **server on your phone** so friends connect to you — no laptop needed.

## What you need

- Android phone with [Termux](https://f-droid.org/en/packages/com.termux/) (install from F-Droid)
- Same Wi‑Fi or your phone's **mobile hotspot**
- ~200 MB free storage for Node.js + the app

## Quick setup (copy-paste in Termux)

```bash
# 1. Update packages
pkg update -y && pkg upgrade -y

# 2. Install Node.js and Git
pkg install -y nodejs git

# 3. Clone the project (or copy the folder from your PC)
git clone https://github.com/jai21-7/Hotspot_messenger.git
cd Hotspot_messenger

# 4. Install dependencies and start
npm install
npm start
```

Or run the setup script from the project folder:

```bash
bash scripts/termux-setup.sh
```

## Share the join link

After `npm start`, Termux prints URLs like:

```
http://192.168.43.1:3000
```

Friends open that address in Chrome **or** scan the QR code on the host page.

## Mobile hotspot mode

1. Turn on **Mobile Hotspot** on the host phone.
2. Friends connect to your hotspot Wi‑Fi.
3. Start the server in Termux (`npm start`).
4. Share the URL shown in the terminal (often `http://192.168.43.1:3000`).

## Keep the server running

- **Don't close Termux** — swipe away kills the server.
- Use `termux-wake-lock` to reduce sleep issues:

```bash
pkg install termux-api
termux-wake-lock
```

- To run in background, install `tmux`:

```bash
pkg install tmux
tmux new -s chat
npm start
# Press Ctrl+B then D to detach. Reattach with: tmux attach -t chat
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Friends can't connect | Same hotspot/Wi‑Fi? Correct IP from `npm start`? |
| Port 3000 in use | `kill $(lsof -t -i:3000)` or change `PORT=3001 npm start` |
| `npm: command not found` | Run `pkg install nodejs` |
| Server stops when screen locks | Use `termux-wake-lock` or `tmux` |

## Hotspot Messenger app + Termux together

You can run the **server in Termux** and use the **Hotspot Messenger Android app** as a client:

1. Start server in Termux (`npm start`).
2. Open the Hotspot Messenger app.
3. Enter the URL from Termux (e.g. `http://192.168.43.1:3000`).
4. Join and chat.

The app and Termux server on the same phone works for testing; friends still need your LAN IP.

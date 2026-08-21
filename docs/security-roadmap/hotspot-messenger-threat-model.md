# Threat model: Hotspot Messenger (this repository)

This is a Phase 4 **worked example** for software you maintain. It is a design review, not a pentest of other people’s networks.

**System:** local Wi‑Fi / hotspot group chat (`server.js` + `public/`)  
**Trust idea:** anyone on the same LAN who can open `http://<host-ip>:3000` is a participant. There is no internet requirement and no user accounts.

## What we are protecting

- Display names and chat/DM contents while the server is running
- Availability of the chat for people on the LAN
- Host machine running Node.js

## Trust boundaries

- **Browser (untrusted)** — any device on the LAN
- **Node server (trusted for this app)** — holds the `users` map in memory
- **LAN / hotspot (partially trusted)** — the README assumes friends on the same network; the network itself is not authenticated
- **Internet** — out of scope for the intended use; the process still listens on `0.0.0.0:3000`

## STRIDE-style notes (controls, not recipes)

### Spoofing

- Join is a display name only (`join` handler). Anyone on the LAN can pick any name, including one already in use.
- Group messages use the **server-known** name from `users`, not a name sent by the client (`chat message`). That reduces “type someone else’s name in the JSON” for group chat.
- DMs are routed by display name; duplicate names can receive the same DM (`getSocketIdsByName`).

**Controls today:** server-side name for group chat; trim/length limits on names.  
**Controls to add:** unique names; optional shared room password; bind identity to socket and reject duplicate names.

### Tampering

- Messages are not authenticated or integrity-protected beyond “you have a socket to this server.”
- Traffic is **HTTP**, not HTTPS (typical for a LAN demo).

**Controls to add:** if this ever left a trusted LAN, use TLS; for LAN, treat the hotspot password as the real gate and keep the host OS patched.

### Repudiation

- No durable audit log of messages (in-memory only).
- Server `console.log` records connect/disconnect socket ids, not full chat history.

**Controls to add:** optional local-only logging on the host if you need a record; tell users that chat is not a legal audit trail.

### Information disclosure

- Join URLs are shown in the UI and terminal (`/api/join-info`).
- Online names are broadcast to everyone.
- Group messages go to **every** connected browser.
- DMs go to sender + sockets with matching display name only (better than group), but names are not unique and transport is plaintext HTTP on the LAN.

**Controls today:** DM targeting; 500-character text cap.  
**Controls to add:** unique names; do not expose join info to strangers; firewall the port when not hosting friends.

### Denial of service

- Server listens on all interfaces (`0.0.0.0`).
- No rate limiting on join, chat, DM, or typing events.
- Process is a single Node instance; a flood of connections or events can make chat unusable.

**Controls to add:** host firewall when idle; rate limits; max connections; run only while you intend to host.

### Elevation of privilege

- There is no operator vs user role in the app. Every joiner can chat and DM.
- The **host OS account** that runs `npm start` is the real privilege boundary. Do not run the server as a highly privileged user.

**Controls today:** must `join` before chat/DM.  
**Controls to add:** run as a standard user; OS firewall allow-list.

## Dependency hygiene (your repo)

- `package.json` pins Express and Socket.io via `package-lock.json`.
- Periodically run `npm audit` **on this project** and apply maintained upgrades.
- Do not paste secrets into chat or commit `.env` files (this app has none today).

## Out of scope

- Testing anyone else’s hotspot, phones, or copies of this app
- Adding exploit code or “demo attacks”

## Checkpoint for Phase 4

You can copy this file into [templates/threat-model.md](templates/threat-model.md) answers, then list one control you actually implement later (for example unique display names or a room password) in a normal product PR.

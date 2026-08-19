# Threat model: Hotspot Messenger (this repository)

This is a Phase 4 **worked example** for software you maintain. It is a design review, not a pentest of other people’s networks.

**System:** local Wi‑Fi / hotspot group chat (`server.js` + `public/` + `history.js`)  
**Trust idea:** anyone on the same LAN who can open `http://<host-ip>:3000` is a participant. There is no internet requirement and no user accounts.

**Last reviewed:** Phase 4 kickoff (AppSec track)

## What we are protecting

- Display names, avatars, and chat/DM contents (in memory and in `data/history.json`)
- Uploaded files in `data/uploads/` (images, PDFs, plain text, zip — max 5 MB)
- Availability of the chat for people on the LAN
- Host machine running Node.js

## Trust boundaries

- **Browser (untrusted)** — any device on the LAN; may run client-side AES for optional room/DM encryption (`public/crypto.js`)
- **Node server (trusted for this app)** — holds `users`, routes Socket.io events, persists history and uploads
- **LAN / hotspot (partially trusted)** — the README assumes friends on the same network; the network itself is not authenticated
- **Internet** — out of scope for the intended use; the process still listens on `0.0.0.0:3000`

## STRIDE-style notes (controls, not recipes)

### Spoofing

- Join is a display name only (`join` handler). Anyone on the LAN could previously pick a name already in use.
- Group messages use the **server-known** name from `users`, not a name sent by the client (`chat message`). That reduces “type someone else’s name in the JSON” for group chat.
- DMs are routed by display name; duplicate names could receive the same DM (`getSocketIdsByName`).

**Controls today:** server-side name for group chat; trim/length limits on names; **unique display names enforced on join** (Phase 4).  
**Controls to add:** optional shared room password for joining the server; bind sessions more strongly if you add accounts later.

### Tampering

- Messages are not authenticated or integrity-protected beyond “you have a socket to this server.”
- Optional client-side AES encryption for room/DM text and attachments — passphrase is shared out-of-band; server stores ciphertext only when enabled.
- Traffic is **HTTP**, not HTTPS (typical for a LAN demo).
- File uploads are renamed to random UUIDs; MIME allow-list and size cap on the server.

**Controls today:** upload MIME/size limits; encrypted payload fields stored separately from plaintext.  
**Controls to add:** if this ever left a trusted LAN, use TLS; for LAN, treat the hotspot password as the real gate and keep the host OS patched.

### Repudiation

- Channel and DM history persist to `data/history.json` on the host (not a tamper-evident audit log).
- Server `console.log` records connect/disconnect socket ids, not full chat history.
- Users can edit/delete their own messages (authorization checked by display name in `history.js`).

**Controls today:** persisted history for convenience; edit/delete limited to message author.  
**Controls to add:** tell users that chat is not a legal audit trail; optional host-only export if you need records.

### Information disclosure

- Join URLs are shown in the UI and terminal (`/api/join-info`).
- Online names and avatars are broadcast to everyone.
- Channel messages go to everyone in that Socket.io room.
- DMs go to sender + sockets with matching display name only.
- Encrypted rooms hide plaintext from the server when clients use passphrases correctly; metadata (who, when, room) still visible.
- Uploads are served as static files under `/uploads/` — anyone on the LAN who knows the URL can fetch them.

**Controls today:** DM targeting; 500-character text cap; optional encryption; unique names reduce DM misdelivery.  
**Controls to add:** do not expose join info to strangers; firewall port 3000 when not hosting; signed/expiring upload URLs if sensitivity increases.

### Denial of service

- Server listens on all interfaces (`0.0.0.0`).
- A flood of connections or events can make chat unusable on a single Node process.

**Controls today (Phase 4):** per-socket rate limits on join, chat, DM, and typing; per-IP upload rate limit; max 100 concurrent connections.  
**Controls to add:** host firewall when idle; run only while you intend to host; consider reverse proxy if you outgrow a single process.

### Elevation of privilege

- There is no operator vs user role in the app. Every joiner can chat, DM, create rooms/channels, and upload files.
- Edit/delete is scoped to the message author name on the socket.
- The **host OS account** that runs `npm start` is the real privilege boundary.

**Controls today:** must `join` before chat/DM; author checks on edit/delete.  
**Controls to add:** run as a standard user; OS firewall allow-list; admin role if you add moderation.

## Dependency hygiene (your repo)

- `package.json` pins Express, Socket.io, multer, and qrcode via `package-lock.json`.
- Run `npm run audit` periodically on **this project** and apply maintained upgrades.
- Do not paste secrets into chat or commit `.env` files (this app has none today).

## Out of scope

- Testing anyone else’s hotspot, phones, or copies of this app
- Adding exploit code or “demo attacks”

## Phase 4 checkpoint

- [x] Threat model updated for current features (rooms, encryption, uploads, PWA)
- [x] Controls implemented: unique names, rate limits, connection cap, `npm run audit`
- [ ] Optional next: room join password, expiring upload links, TLS if exposed beyond LAN

See also: [phase-4-file-upload-threat-model.md](phase-4-file-upload-threat-model.md) and [phase-4-asvs-checklist.md](phase-4-asvs-checklist.md).

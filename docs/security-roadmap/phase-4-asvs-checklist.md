# OWASP ASVS-style checklist — Hotspot Messenger

Use this as a **read-only review** of *your* code during Phase 4. Levels are informal (V1 = basic LAN demo, V2 = hardened LAN, V3 = if you ever ship beyond friends-on-hotspot).

Reference: [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) and [Cheat Sheet Series](https://cheatsheetseries.owasp.org/).

## V1 Authentication

| Item | Status | Notes |
| ---- | ------ | ----- |
| Display names are not passwords | ✅ | Names are public labels only |
| No secrets in client JS | ✅ | Passphrases stay in browser memory for encryption |
| Unique names on join | ✅ | Phase 4 — `security.js` + join handler |
| Room/server join password | ⬜ | Optional future control |

## V2 Session management

| Item | Status | Notes |
| ---- | ------ | ----- |
| Identity bound to socket after join | ✅ | `users` map |
| Re-join with same name blocked while online | ✅ | Phase 4 |
| Session ends on disconnect | ✅ | `users.delete` on disconnect |

## V3 Access control

| Item | Status | Notes |
| ---- | ------ | ----- |
| Chat/DM require join | ✅ | Handlers check `users.get(socket.id)` |
| Edit/delete limited to author | ✅ | `history.js` name check |
| No admin vs user roles | ⚠️ | By design for demo; document as gap |
| Upload without join | ⚠️ | `/api/upload` is open to LAN; see file-upload threat model |

## V4 Input validation

| Item | Status | Notes |
| ---- | ------ | ----- |
| Name/channel/room length limits | ✅ | `.slice(0, 24)` etc. |
| Message text length cap | ✅ | 500 chars |
| QR `url` query validated | ✅ | Must start with `http` |
| File type and size limits | ✅ | multer filter + 5 MB |

## V5 Cryptography

| Item | Status | Notes |
| ---- | ------ | ----- |
| TLS in transit | ⬜ | HTTP on LAN — document risk |
| Client-side AES for optional encryption | ✅ | `public/crypto.js`; passphrase out-of-band |
| No home-grown server crypto for auth | ✅ | N/A for this app |

## V7 Error handling & logging

| Item | Status | Notes |
| ---- | ------ | ----- |
| Upload errors return JSON, not stack traces | ✅ | Express error middleware |
| Join/upload rate limit feedback | ✅ | `join error` / HTTP 429 |
| No secrets in logs | ✅ | Review `console.log` periodically |

## V9 Communication

| Item | Status | Notes |
| ---- | ------ | ----- |
| Socket.io same origin as page | ✅ | Default setup |
| CORS not wide open to internet | ✅ | LAN-only intent; still bind firewall on host |

## V14 Configuration

| Item | Status | Notes |
| ---- | ------ | ----- |
| Dependencies in lockfile | ✅ | `package-lock.json` |
| `npm run audit` script | ✅ | Phase 4 |
| `.env` not committed | ✅ | No secrets file in repo |
| Listen `0.0.0.0` documented | ✅ | Threat model + README |

## Weekly action

Pick **one** ⬜ or ⚠️ row per week. Implement or document the fix in a normal product PR (like Phase 4 security controls).

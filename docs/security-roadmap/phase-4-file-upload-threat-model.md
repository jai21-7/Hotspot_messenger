# Feature threat model: file uploads

**System / feature:** `POST /api/upload` + `/uploads/:fileId` (multer in `server.js`)  
**Date:** Phase 4 week 1  
**Author:** AppSec study (this repo)

## What we are protecting

- Host disk space and CPU (reject oversized or excessive uploads)
- Other users on the LAN (no executable malware served from our origin)
- Filename / path tricks that could confuse clients or operators

## Trust boundaries

- **Uploader browser** — can send arbitrary bytes labeled with a MIME type
- **Express + multer** — validates size and MIME, stores under `data/uploads/` with a random filename
- **Any LAN client** — can request `/uploads/<uuid>` if they know or guess the URL

## STRIDE-style questions

| Category | Notes |
| -------- | ----- |
| Spoofing | Upload does not require a display name today; abuse is mostly annoyance/DoS, not identity theft. |
| Tampering | Stored files are not signed; a LAN attacker could replace files only if they compromise the host. |
| Repudiation | No per-upload audit log beyond the file on disk and chat message reference. |
| Information disclosure | Upload URLs are predictable only by UUID; chat messages expose URLs to channel/DM participants. |
| Denial of service | Large or frequent uploads could fill disk; mitigated by 5 MB cap and upload rate limit (Phase 4). |
| Elevation of privilege | Upload does not grant admin rights; files are not executed by the server. |

## Controls we have today

- Max 5 MB per file (`MAX_FILE_SIZE`)
- MIME allow-list + `image/*` prefix for common image types
- Random UUID filenames (no user-controlled paths)
- Upload rate limit per client IP (12/minute)
- Attachments referenced from chat messages only after successful upload

## Controls we should add

- [ ] Virus scan on host if you accept files from untrusted LANs
- [ ] Short-lived signed download URLs if files are sensitive
- [ ] Require `join` before upload (tie socket/session cookie to upload)
- [ ] Periodic cleanup of orphaned uploads not referenced in history

## Out of scope

- Scanning or attacking other people’s file shares
- Hosting user executables

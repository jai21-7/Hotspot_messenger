# Remediation write-up: file upload hardening

**Project:** Hotspot Messenger (this repository)  
**Date:** 2026-08-19  
**In scope?** yes — personal project

## What we were protecting

Users can attach images and small files in chat. Uploads land in `data/uploads/` and are served back over HTTP on the LAN.

## Weakness class

Unrestricted file upload / insufficient validation (OWASP File Upload Cheat Sheet).

## Evidence (allowed)

- Feature threat model: [phase-4-file-upload-threat-model.md](../phase-4-file-upload-threat-model.md)
- Code review of `multer` config in `server.js`

## Impact (in this app’s context)

- Disk exhaustion (mitigated partly by 5 MB cap)
- Serving unexpected content types if MIME is spoofed
- Malware staging on the host (LAN trust assumption — still worth limiting)

## Remediation (implemented + planned)

**Implemented:**

| Control | Where |
| ------- | ----- |
| Max size 5 MB | `multer` limits |
| Allow-list MIME types | `ALLOWED_MIME` set + `image/*` prefix |
| Random UUID filenames | prevents overwrite and path guessing |
| Upload rate limit | HTTP middleware before `multer` |

**Documented / planned (ASVS follow-up):**

- Require active socket session before accepting upload
- Virus scan hook for shared machines (out of scope for LAN MVP)
- Serve uploads with `Content-Disposition: attachment` for non-images

## Detection

- Monitor upload directory growth rate
- Alert on repeated `429` from same client IP
- Periodic review of files in `data/uploads/`

## References

- OWASP File Upload Cheat Sheet
- [phase-4-file-upload-threat-model.md](../phase-4-file-upload-threat-model.md)

# Remediation write-up: per-event rate limiting

**Project:** Hotspot Messenger (this repository)  
**Date:** 2026-08-19  
**In scope?** yes — personal project, no third-party testing

## What we were protecting

A LAN chat server (`server.js`) that accepts Socket.io events (join, chat, DM, typing) and HTTP file uploads. On a shared hotspot, one misbehaving client could spam messages or uploads and degrade the experience for everyone.

## Weakness class

Missing rate limiting / resource exhaustion (CWE-770, OWASP API4:2023 Unrestricted Resource Consumption).

## Evidence (allowed)

- Threat model row: “spam / flood” in [hotspot-messenger-threat-model.md](../hotspot-messenger-threat-model.md)
- ASVS checklist note on abuse resistance in [phase-4-asvs-checklist.md](../phase-4-asvs-checklist.md)
- No live attack — design review only

## Impact (in this app’s context)

- Chat unusable for other hotspot users
- Disk fill from rapid uploads (combined with upload size cap)
- CPU load from broadcast storms

## Remediation

Added `security.js` with a lightweight `RateLimiter` and per-event buckets:

| Event | Limit | Window |
| ----- | ----- | ------ |
| join | 8 | 60s |
| chat | 40 | 60s |
| DM | 30 | 60s |
| typing | 120 | 60s |
| upload (HTTP) | 12 | 60s |

Also capped total Socket.io connections at 100. Buckets clear on disconnect.

Client shows a friendly error when join is rejected (`join error` handler in `public/app.js`).

## Detection

- Server logs already show connect/disconnect; add metric: `429` upload responses or silent chat drops under load test
- In production you would alert on sustained limit hits per IP/socket

## References

- OWASP API Security Top 10 — API4:2023
- [05-phase-4-appsec.md](../05-phase-4-appsec.md) controls list

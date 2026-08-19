# Phase 4 — weekly log (week 1)

Copy [templates/weekly-log.md](templates/weekly-log.md) for future weeks. This file records the **kickoff** week.

## Week of

2026-08-19 (Phase 4 start)

## Hours (~10 target)

| Activity | Hours |
| -------- | ----- |
| Threat model review (main app + file uploads) | 2 |
| ASVS checklist walkthrough | 2 |
| Implement controls (unique names, rate limits, audit script) | 3 |
| Notes / docs | 1 |
| Linux + networking (keep sharp) | 2 |

## What I did

- Read [05-phase-4-appsec.md](05-phase-4-appsec.md) and [hotspot-messenger-threat-model.md](hotspot-messenger-threat-model.md)
- Updated threat model for rooms, encryption, uploads, and persisted history
- Wrote [phase-4-file-upload-threat-model.md](phase-4-file-upload-threat-model.md)
- Walked [phase-4-asvs-checklist.md](phase-4-asvs-checklist.md) against the codebase
- Ran `npm run audit` (0 vulnerabilities at kickoff)
- Shipped controls: unique display names, per-event rate limits, max connections, client `join error` handling

## Checkpoint progress

- [x] Threat model of one feature you built (main app + file uploads)
- [x] Controls listed (added or planned) — see threat model “Phase 4 checkpoint”
- [x] Dependency/lockfile hygiene (`npm run audit` in `package.json`)
- [x] No live testing of third-party apps

## Blockers / questions

- Room join password: worth building next, or document as LAN-trust assumption?
- Should uploads require an active socket session?

## Next week

- Pick one ASVS ⚠️ row (upload-without-join or no TLS) and either fix or document
- Re-run `npm run audit` after any dependency bump
- Optional: threat-model **DM encryption** flow using [templates/threat-model.md](templates/threat-model.md)

# Phase 4 — AppSec / secure coding (months 16–20)

Apply defense and lab lessons to **software you maintain**. Hotspot Messenger in this repository is an allowed target because it is **your** project.

Do not live-test third-party apps without a written program.

## Started — week 1 materials

| Resource | Purpose |
| -------- | ------- |
| [hotspot-messenger-threat-model.md](hotspot-messenger-threat-model.md) | Worked STRIDE example (updated for current app) |
| [phase-4-file-upload-threat-model.md](phase-4-file-upload-threat-model.md) | Feature-level threat model |
| [phase-4-asvs-checklist.md](phase-4-asvs-checklist.md) | OWASP ASVS-style review checklist |
| [phase-4-weekly-log-01.md](phase-4-weekly-log-01.md) | First weekly log |

**Controls shipped in week 1:** unique display names, rate limits (join/chat/DM/typing/upload), max connections, `npm run audit`.

## Topics

- Threat modeling (STRIDE or similar) for *your* features
- OWASP ASVS or Cheat Sheet Series as a **checklist**: auth, sessions, crypto use, input handling, dependencies
- Code review of *your* projects: secrets in git, authorization gaps, unsafe defaults
- Dependency hygiene: lockfiles, known-vulnerability scanning on *your* repo

## How to work this phase

1. Copy [templates/threat-model.md](templates/threat-model.md) for one feature
2. Read [hotspot-messenger-threat-model.md](hotspot-messenger-threat-model.md) (worked example for this app)
3. Walk OWASP ASVS / Cheat Sheets as a checklist against *your* code
4. Review `package.json` / lockfile; keep dependencies updated on *your* repo
5. Optional later: vendor AppSec courses; CSSLP if you go corporate AppSec

## Checkpoint

- [x] Threat model one real feature you built — see linked docs above
- [x] List controls you added or would add — threat models + ASVS checklist
- [x] No live testing of third-party apps without written authorization

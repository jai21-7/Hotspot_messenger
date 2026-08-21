# Phase 4 — AppSec / secure coding (months 16–20)

Apply defense and lab lessons to **software you maintain**. Hotspot Messenger in this repository is an allowed target because it is **your** project.

Do not live-test third-party apps without a written program.

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

- [ ] Threat model one real feature you built
- [ ] List controls you added or would add
- [ ] No live testing of third-party apps without written authorization

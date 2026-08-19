# Combined cybersecurity roadmap (all three tracks)

This folder is a **legal, authorized** study path: shared foundations, then **defense (SOC/IR)**, then **authorized pentest labs**, then **AppSec**. Work the phases in order. Do not skip Phase 0–1.

Unauthorized access to other people’s networks, accounts, or apps is a crime. This material does **not** include exploits, payloads, attack procedures, malware, or “how to hack X.”

## Order of work (~18–24 months at ~10 hours/week)

```text
Phase 0 literacy → Phase 1 foundations → Phase 2 defense
    → Phase 3 authorized labs → Phase 4 AppSec → Phase 5 career
```

Overlap is allowed at the edges (keep using the home lab while you start Security+). Do not run three full tracks in the same week.

| Phase | When | Guide |
| ----- | ---- | ----- |
| Mindset | Always | [00-mindset-and-legal.md](00-mindset-and-legal.md) |
| 0 Core literacy | Months 1–4 | [01-phase-0-core-literacy.md](01-phase-0-core-literacy.md) · **[beginner resources](01-phase-0-resources.md)** |
| 1 Security foundations | Months 4–7 | [02-phase-1-security-foundations.md](02-phase-1-security-foundations.md) |
| 2 Defense / SOC / IR | Months 7–11 | [03-phase-2-defense.md](03-phase-2-defense.md) |
| 3 Authorized pentest labs | Months 11–16 | [04-phase-3-authorized-labs.md](04-phase-3-authorized-labs.md) |
| 4 AppSec | Months 16–20 | [05-phase-4-appsec.md](05-phase-4-appsec.md) |
| 5 Career | After month 12 | [06-phase-5-career.md](06-phase-5-career.md) · **[portfolio](portfolio/)** · [weekly log](phase-5-weekly-log-01.md) |
| Checkpoints | All phases | [CHECKPOINTS.md](CHECKPOINTS.md) |

## Templates and practice

- Notes: [templates/notes.md](templates/notes.md)
- Lab write-up (finding + **fix**): [templates/lab-writeup.md](templates/lab-writeup.md)
- Weekly log: [templates/weekly-log.md](templates/weekly-log.md)
- Threat model: [templates/threat-model.md](templates/threat-model.md)
- Phase 0 Python checkpoint: [practice/](practice/)
- Resume bullets: [templates/resume-bullets.md](templates/resume-bullets.md)
- Phase 5 portfolio: [portfolio/](portfolio/)
- Example AppSec on **this** repo: [hotspot-messenger-threat-model.md](hotspot-messenger-threat-model.md)

## Why this order

1. **Defense first** — you learn how systems should look and how evidence appears in logs. This is also the most common junior hiring path.
2. **Authorized labs second** — closest legal analogue to “hacking,” only on purpose-built platforms. Every finding needs a remediation.
3. **AppSec last** — you apply both views to software you actually write (including Hotspot Messenger).

## Weekly rhythm after Phase 1 (~10 hours)

- 4h current phase
- 2h Linux + networking (keep sharp)
- 2h notes / write-ups / fixes
- 2h optional cert study for the phase you are in

## Success picture at ~20 months

You can administer a lab, read logs, describe common weakness *classes*, complete authorized beginner labs with **fixes documented**, and review your own app for secure design. Anything beyond that is a job, a scoped contract, or a named bounty program — not unstructured “hacking.”

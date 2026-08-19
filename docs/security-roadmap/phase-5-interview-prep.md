# Phase 5 — interview prep (junior roles)

Study these themes. Answers should use **your** portfolio examples where possible.

## SOC / defense interviews

| Theme | Prepare |
| ----- | ------- |
| Log triage | Walk through [practice/sample-auth.txt](../practice/sample-auth.txt) — what is normal vs suspicious? |
| Incident basics | Your one-page IR outline: identify → contain → eradicate → recover → lessons |
| Networking | Explain TCP handshake, DNS, DHCP at a high level |
| Tools | Name one SIEM or log tool you have used (even ELK on a home lab counts) |
| Shift fit | How you handle alert fatigue and documentation |

**Sample answer scaffold:** “In my home lab I noticed repeated failed SSH attempts from one IP. I would block at the firewall, preserve logs, check for successful logins, and document timeline.”

## AppSec interviews

| Theme | Prepare |
| ----- | ------- |
| Threat modeling | Summarize STRIDE on Hotspot Messenger in 2 minutes |
| OWASP Top 10 | Pick 3 categories and tie each to your project or a lab |
| Secure SDLC | Where in your workflow do you run `npm audit`? When do you threat-model? |
| Code review | Show [portfolio/writeup-01-rate-limiting.md](../portfolio/writeup-01-rate-limiting.md) — weakness, fix, detection |
| Crypto | What client-side AES does **and does not** protect in this app |

**Sample answer scaffold:** “Uploads were limited by size and MIME allow-list because the threat model flagged disk exhaustion and unexpected content types. Rate limits address spam on a shared LAN.”

## Behavioral (all tracks)

- Tell me about a time you documented something for someone else
- How do you learn a new technology under time pressure?
- Describe a mistake you made and what you changed

Use real study logs — finishing a weekly log counts.

## Mock interview checklist

- [ ] 2-minute project pitch (Hotspot Messenger + security work)
- [ ] One lab write-up explained aloud with remediation
- [ ] One “I don’t know, but I would…” answer practiced (shows honesty)

## Resources (official, free)

- OWASP Cheat Sheet Series (category pages, not exploit blogs)
- Your own [portfolio/](../portfolio/) and [CHECKPOINTS.md](../CHECKPOINTS.md)

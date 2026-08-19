# Portfolio (Phase 5)

Hiring managers for junior roles want **evidence you can think like a defender**, not screenshots of illegal access.

## What belongs here

| Include | Exclude |
| ------- | ------- |
| Authorized lab write-ups with remediation | Live-system dumps |
| Threat models of **your** projects | Step-by-step exploit chains on real targets |
| Before/after code or config changes | Credentials, tokens, or PII |
| “Weakness class → impact → fix → detection” | Bragging about out-of-scope findings |

## Folder layout

```text
portfolio/
  README.md                 ← you are here
  writeup-01-rate-limiting.md
  writeup-02-unique-names.md
  writeup-03-upload-hardening.md
  (add writeup-04 … writeup-10 as you complete labs)
```

## Quality bar (each write-up)

1. **Context** — platform or project, date, scope confirmed
2. **Weakness class** — e.g. missing rate limit, IDOR, weak upload validation
3. **Impact** — what could go wrong *in that context*
4. **Remediation** — what you changed or would change
5. **Detection** — how a defender would notice a repeat

Use [templates/lab-writeup.md](../templates/lab-writeup.md) for authorized platform rooms. Use the `writeup-*.md` files in this folder as examples for **your own repo**.

## Target count

Aim for **5–10** write-ups before serious applications. Three AppSec examples from Hotspot Messenger count toward that total if they follow the format above.

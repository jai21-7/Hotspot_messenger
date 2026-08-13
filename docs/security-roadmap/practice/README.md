# Phase 0 practice: read a log file

This is **your** sample data. It is for learning how to *read* logs (Phase 0 checkpoint and Phase 2 “what looks abnormal”).

## Run

From the repository root:

```bash
python3 docs/security-roadmap/practice/read_log.py
```

Optional: pass another file you created on **your** machine:

```bash
python3 docs/security-roadmap/practice/read_log.py path/to/your.log
```

## What you should notice (defense catalog)

The sample includes many `FAILED` lines for one username and a later `SUCCESS`. In a SOC, that pattern is a reason to look at lockout policy, MFA, and whether the account should exist — not a reason to attack anything.

Do not point this script at logs you are not allowed to have.

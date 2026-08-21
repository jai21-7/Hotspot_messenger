# Phase 2 — Defense / SOC / IR (months 7–11)

Practice seeing problems from the **log and alert** side, then hardening. This is the usual door into junior SOC / security operations jobs.

## What you practice

- Where evidence lives
- What a SOC watches for (catalogs, not attacker playbooks)
- Intro SIEM on **your** lab logs only
- Incident response outline
- Hardening checklists as a reading list

## Where evidence lives (concepts)

- Linux: syslog / `journalctl` (your VM)
- Windows: Event Viewer (your VM)
- Web/proxy logs if you run a local test server **you own** (for example this app’s terminal output on localhost)

Do not collect other people’s logs.

## Detection ideas (catalog only)

Examples of what analysts look for:

- Repeated failed logins
- A new administrator account
- Unusual outbound traffic from a workstation
- Service crashes or unexpected restarts

For each, write: *what log might show it* and *what you would change on the host* (rate limits, MFA, least privilege, patching). No playbooks for causing those events.

## Intro SIEM

Pick one:

- Splunk Fundamentals 1 (free/trial as offered), or
- Elastic / Kibana intro

Ingest logs from **your lab VMs only**. Goal: search, simple dashboards, a saved alert on failed logins in the sample or lab data.

## Incident response (NIST-style outline)

1. Identify
2. Contain
3. Eradicate
4. Recover
5. Lessons learned

Write a one-page IR outline for a fictional “stolen laptop” or “compromised lab VM” using that structure. Do not practice containment on networks you do not own.

## Hardening

Use CIS Benchmarks **as a reading list** for:

- One Linux VM you own
- One Windows VM you own

Apply only changes you understand. Snapshot first. Record what you changed and why.

## Courses / certs (pick one path)

- Google Cybersecurity Certificate, **or**
- CompTIA CySA+ study after Security+
- Blue Team Level 1 later if you stay in defense

## Checkpoint

- [ ] Given a sample lab log (see [practice/sample-auth.txt](practice/sample-auth.txt)), say what looks abnormal
- [ ] Write what you would change on the host to reduce it
- [ ] IR one-pager using the five steps above
- [ ] At least one CIS-inspired hardening change documented in notes

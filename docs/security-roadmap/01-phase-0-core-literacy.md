# Phase 0 — Core literacy (months 1–4)

You cannot skip this. Defense, authorized labs, and AppSec all rest on it.

## Goals

- Explain what a packet, a port, a process, and a log file are
- Administer a Linux VM from the terminal (no GUI required)
- Use Windows enough to find Event Viewer and tell admin vs standard user apart
- Read simple Python and a simple HTML/JS page
- Optional: Git so later write-ups live in a repo

## Topics

### How computers work

- Processes, files, users, permissions
- What “running as admin/root” means (power and risk)

### Linux daily use

Prefer a Linux VM as your daily practice OS.

- Terminal: navigation, reading files, permissions (`ls`, `cd`, `cat`, `less`, `chmod`/`chown` at a conceptual level)
- Users and groups
- Services (what starts at boot)
- Logs (where they live; how to *read* them)
- Package managers (install updates on *your* VM)

Suggested: Ubuntu Server or Debian VM; 1–2 hours of terminal almost every study day.

### Windows basics

- Local accounts vs Microsoft accounts (high level)
- Services
- Event Viewer (where Windows records security-relevant events)
- Administrator vs standard user

### Networking (concepts only)

- IP addresses, TCP vs UDP, ports
- DNS, HTTP vs HTTPS
- NAT, firewalls (what they are for)

Courses (pick one): Cisco Networking Academy *Introduction to Networks*, or Professor Messer-style networking videos. Goal is vocabulary, not vendor exam dumping.

### Programming enough to read code

- Python: variables, files, loops, functions
- HTML/CSS/JS enough to follow a simple web page (this repo’s `public/` folder is a valid example)

Optional: Git + GitHub for notes and later lab write-ups.

## Home lab setup (your machines only)

1. Install a hypervisor on **your** computer.
2. Create one Linux VM and one Windows VM (evaluation/ISO you are licensed to use).
3. Snapshot a clean state so you can roll back.
4. Do not bridge lab VMs onto networks you do not own.

## Weekly rhythm (Phases 0–1)

- 3–4h Linux / networking / Python
- 2–3h conceptual security (start light in month 3–4)
- 2h home-lab admin
- 30m notes

## Practice: Python log reader

The Phase 0 checkpoint includes writing a small script that reads a text/log file.

1. Open [practice/README.md](practice/README.md)
2. Run `python3 docs/security-roadmap/practice/read_log.py`
3. Optionally extend the script to print which usernames failed most often (still on the sample file only)

## Checkpoint (do not leave Phase 0 until true)

- [ ] Explain packet, port, process, log in your own words (write them in [templates/weekly-log.md](templates/weekly-log.md))
- [ ] Administer your Linux VM from the terminal (update packages, create a user, read a log)
- [ ] Run the sample log reader and understand its output

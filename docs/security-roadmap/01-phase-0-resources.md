# Phase 0 beginner resources

Use **one primary resource per topic**. Extra links are optional. Everything here is free (or has a free path) and is for learning on **your** computer / official course sites — not other people’s networks.

Suggested pace: about **10 hours/week for 16 weeks**. Repeat a week if it feels hard. That is normal.

## Easy order (do not study all of this at once)

| Weeks | Focus | Primary resource |
| ----- | ----- | ---------------- |
| 1 | How a computer works | Crash Course Computer Science, episodes 1–8 |
| 2–3 | Home lab + first Linux clicks | VirtualBox + Ubuntu Desktop (below) |
| 4–7 | Linux terminal every day | Ubuntu “Command line for beginners” then *The Linux Command Line* |
| 8–10 | Networking vocabulary | Cisco Networking Basics **or** Professor Messer Network+ videos 1–20 |
| 11–14 | Python to read files | *Automate the Boring Stuff* chapters 1–9, then this repo’s log script |
| 15 | Windows Event Viewer + admin vs user | Microsoft Learn + your Windows PC/VM |
| 16 | Git + HTML peek + checkpoint | GitHub Skills + this repo `public/` folder |

Keep a [weekly log](templates/weekly-log.md). After week 16, tick the [Phase 0 checkpoint](01-phase-0-core-literacy.md#checkpoint-do-not-leave-phase-0-until-true).

---

## 1. How computers work (week 1)

**Primary (video, very beginner):** [Crash Course Computer Science](https://www.youtube.com/playlist?list=PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo) — watch **1–8** only (binary, CPU, memory, files). Pause and write: *process, file, user, permission*.

**Backup (short articles):** [Cloudflare Learning — What is a computer network?](https://www.cloudflare.com/learning/network-layer/what-is-a-computer-network/) after the videos, not before.

Skip university OS textbooks for now.

---

## 2. Home lab (weeks 2–3) — your machines only

You need a place to break and fix **your** OS.

1. Install [VirtualBox](https://www.virtualbox.org/) (Windows/Linux host) or Hyper-V (Windows Pro) or [UTM](https://mac.getutm.app/) (Mac).
2. Create a VM from [Ubuntu Desktop](https://ubuntu.com/download/desktop) (easier than Server for a first month).
3. Take a **snapshot** named `clean` after the first successful login.
4. Optional later: [Windows 11 Enterprise evaluation](https://www.microsoft.com/en-us/evalcenter) VM — only if you accept Microsoft’s eval terms.

**Help:** Oracle’s VirtualBox User Manual, chapter “First Steps”; Ubuntu’s own “Try Ubuntu” / install guide on the download page.

Do not attach the VM to Wi‑Fi you do not own. NAT mode in VirtualBox is the safe default.

---

## 3. Linux (weeks 4–7)

Practice **inside your Ubuntu VM**. Type every command yourself.

**Primary (short, official):** [Ubuntu — Command line for beginners](https://ubuntu.com/tutorials/command-line-for-beginners)

**Primary (free book, go slow):** [The Linux Command Line](https://linuxcommand.org/tlcl.php) by William Shotts — Part 1 (Learning the Shell): chapters on navigation, files, permissions, redirection. Stop before scripting until Python weeks.

**Practice site (optional, after you know `ls`/`cd`/`cat`):** [Linux Journey](https://linuxjourney.com/) — “Command Line”, “User Management”, “Permissions”, “Process Management”, “Logging”.

**Optional game (official wargame, Linux only):** [OverTheWire Bandit](https://overthewire.org/wargames/bandit/) levels 0–10. This is *their* training server. Read their rules. Stop at level 10 in Phase 0.

**What to be able to do on your VM**

- Update packages (`sudo apt update` then `sudo apt upgrade` on *your* Ubuntu)
- Create a user, switch user, read `/var/log/syslog` or `journalctl -n 50`
- Explain `ls`, `cd`, `pwd`, `cat`, `less`, `grep`, `man`

---

## 4. Networking concepts (weeks 8–10)

Goal: **words**, not exams and not scanning.

**Pick one video/course path:**

- **A (structured, free account):** [Cisco Networking Academy — Networking Basics](https://www.netacad.com/courses/networking-basics) (sometimes listed as “Introduction to Networks” / Networking Basics). Create a free NetAcad account.
- **B (YouTube, exam-flavored but clear):** [Professor Messer Network+](https://www.professormesser.com/) — watch the early videos on OSI/TCP-IP, IP addresses, TCP vs UDP, DNS, HTTP/HTTPS, NAT, firewalls. Ignore exam dumps and later “security tools” episodes until Phase 1.

**Tiny glossary (read after 3–4 videos):**

- [What is an IP address?](https://www.cloudflare.com/learning/dns/glossary/what-is-my-ip-address/)
- [What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)
- [What is HTTP?](https://www.cloudflare.com/learning/ddos/glossary/hypertext-transfer-protocol-http/)
- [What is a firewall?](https://www.cloudflare.com/learning/ddos/glossary/firewall/)

**On your VM:** run `ip addr` (Linux) or `ipconfig` (Windows) and write down your *lab* IPv4 address. That is enough hands-on for Phase 0.

---

## 5. Python (weeks 11–14)

You only need to **read and write small scripts**, not become a software engineer.

**Primary (free book + videos):** [Automate the Boring Stuff with Python](https://automatetheboringstuff.com/) — chapters **1–9** (basics, flow, functions, lists, dictionaries, files). Do the example programs.

**Backup:** [Python.org tutorial](https://docs.python.org/3/tutorial/) sections 1–9, **or** [CS50’s Introduction to Programming with Python](https://cs50.harvard.edu/python/) weeks 0–3.

**This repo (checkpoint):** [practice/README.md](practice/README.md) — run:

```bash
python3 docs/security-roadmap/practice/read_log.py
```

Then open `read_log.py` and match it to what you learned about files and loops.

Install Python from [python.org/downloads](https://www.python.org/downloads/) on Windows if needed. On Ubuntu: `sudo apt install python3`.

---

## 6. Windows basics (week 15)

Use **your** Windows PC or eval VM.

**Primary:** [Microsoft Learn — Windows](https://learn.microsoft.com/windows/) — search and complete any short module on:

- Local users vs administrators
- Settings → Accounts
- What a Windows *service* is

**Event Viewer:** Microsoft Support — [View event logs](https://support.microsoft.com/windows/open-event-viewer) (search “Open Event Viewer”). Look at **Windows Logs → System** and **Security** *on your machine*. Note one event in your weekly log. Do not collect other people’s logs.

---

## 7. Git, HTML, and this chat app (week 16)

**Git (optional but useful):** [Pro Git](https://git-scm.com/book/en/v2) chapters 1–2, **or** [GitHub Skills](https://skills.github.com/) “Introduction to GitHub”.

**HTML/JS enough to follow a page:** [MDN — Getting started with the Web](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Your_first_website), then skim this repo’s `public/index.html` and `public/app.js`. You do not need to finish a full web-dev bootcamp.

---

## What *not* to use in Phase 0

- Random “learn hacking” YouTube playlists that skip Linux and jump to tools
- Scanning Wi‑Fi, school, or work networks
- Paid “zero to OSCP in 30 days” courses
- Kali Linux as your first OS (Ubuntu Desktop is easier; Kali comes much later, if ever, and only in a lab VM)

## If you get stuck

1. Re-watch / re-read the **same** primary resource — do not add a fourth tutorial.
2. Write the idea in one sentence in [templates/notes.md](templates/notes.md).
3. Move to the next week only when you can do the “what to be able to do” bullets without looking them up every time.

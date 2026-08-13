# Mindset and legal rules (always)

Treat “hacking” as **security engineering**: find weaknesses so they can be **fixed**.

## Scope

Before you touch a system, write down:

- What you own or have **explicit written permission** to test
- What is in scope and what is out of scope
- When testing starts and stops

Allowed: your machines, official lab platforms you paid for or signed up for, employer tests with a written agreement, public bug-bounty programs with a published policy.

Not allowed: scanning or logging into other people’s Wi‑Fi, phones, school/work systems, random IPs, or this (or any) app without a written test agreement.

## Home lab, not the public internet

Use VirtualBox, VMware, Hyper-V, or similar. Practice on VMs you created. Do not probe the public internet “to see what happens.”

## Notes template

For every finding, record:

1. Asset (which VM, lab room, or *your* app)
2. Weakness **class** (catalog name, not a recipe)
3. Impact (what could go wrong)
4. **Remediation** (patch, config, least privilege, design change)

If you cannot state the fix, you are collecting tricks, not learning security.

Copy [templates/notes.md](templates/notes.md) for daily notes.

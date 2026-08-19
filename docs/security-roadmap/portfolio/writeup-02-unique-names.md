# Remediation write-up: unique display names

**Project:** Hotspot Messenger (this repository)  
**Date:** 2026-08-19  
**In scope?** yes — personal project

## What we were protecting

Users join with a display name shown to everyone on the LAN. Before the fix, two people could pick the same name, causing confusion about who sent which message or DM.

## Weakness class

Weak identity binding / impersonation by name collision (not cryptographic auth — display-name integrity).

## Evidence (allowed)

- Manual test: two browsers joining as “Alex” before fix
- Threat model “spoofing” row in [hotspot-messenger-threat-model.md](../hotspot-messenger-threat-model.md)

## Impact (in this app’s context)

- Social engineering: “Alex” sends a DM asking for a room passphrase
- Moderation confusion: cannot tell which “Alex” to mute or remove
- Audit trail useless if names are duplicated

## Remediation

Server-side check in `security.js` (`isNameTaken`) on join:

1. Reject join if another **active socket** already uses that name
2. Emit `join error` with a clear message
3. Client resets join UI so the user picks another name

This is appropriate for a casual LAN chat. It is **not** authentication — names are still self-asserted.

## Detection

- Log `join error` events with reason `name taken` (optional enhancement)
- User reports of “someone stole my name” should drop to zero

## References

- OWASP Authentication Cheat Sheet — session identity vs display name
- [phase-4-asvs-checklist.md](../phase-4-asvs-checklist.md)

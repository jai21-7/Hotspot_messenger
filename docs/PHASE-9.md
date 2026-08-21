# Phase 9 — Safer encryption (beginner guide)

Phase 9 makes private DMs safer **without typing a shared passphrase**.

## The old way (Phase 8 and earlier)

To encrypt a DM, both people typed the **same secret password**.

```
You: "secret123"
Friend: "secret123"
→ messages encrypt
```

Problem: if someone overhears the password, they can read the chat.

## The new way (identity keys)

1. Your phone creates a **private key** (stays on your device) and a **public key** (shared with friends).
2. When you open a DM with someone who also has a public key, both phones do math (ECDH) and get the **same secret**.
3. That secret encrypts the chat — **never sent as a password**.

```
Your private key + Friend's public key  = Shared secret
Friend's private key + Your public key = Same shared secret
```

The server only sees scrambled ciphertext, not readable text.

## How to use it

1. Join the chat (your identity key is created automatically).
2. Open **Settings** → see your **fingerprint** (short ID for your public key).
3. Tap a friend who shows 🔑 in the Online list.
4. Send a DM — it auto-encrypts when both of you have keys.
5. Optional: still type a manual DM passphrase if you want.

## Fingerprint

A fingerprint is a short code from your public key (example: `A1B2 C3D4 E5F6 7890`).

Friends can compare fingerprints in person to confirm it’s really you (advanced safety check).

**New key** button creates a fresh identity. Do this only if you want to reset — old auto-encrypted DMs may not decrypt until friends reconnect.

## What Phase 9 does *not* change

- Room passphrase encryption still works the same for private rooms.
- Offline queue and voice messages from Phase 8 still work.
- Bluetooth / desktop app are still future ideas.

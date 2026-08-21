# Phase 8 — Future features (beginner guide)

Phase 8 adds smarter messaging for real-world hotspot use.

## 8.1 Offline message queue

**Problem:** Wi‑Fi drops for a second — your message is lost.

**Solution:** If you send while disconnected, the app **saves the message on your phone** and sends it automatically when you reconnect.

**How to try:**
1. Join a chat
2. Turn off Wi‑Fi briefly (or stop the server)
3. Type a message and tap Send — you'll see a queue badge
4. Turn Wi‑Fi back on — message sends automatically

**Note:** Text only while offline. Files and voice need a live connection.

## 8.2 Voice messages

**Problem:** Typing on a phone is slow.

**Solution:** Tap the **🎤** button, record up to 60 seconds, then tap Send.

**How to try:**
1. Join a chat
2. Allow microphone access when asked
3. Tap 🎤 → speak → tap 🎤 again to stop
4. Tap Send

Friends see an audio player in the chat bubble.

## Coming later (not built yet)

| Feature | What it means |
|---------|----------------|
| Bluetooth / Wi‑Fi Direct | Chat without a Wi‑Fi router at all |
| Desktop app (Electron) | Same app on Windows/Mac as a desktop program |
| Cloud accounts | Only if you add internet servers later |

**Built in Phase 9:** Safer DM encryption with identity keys — see [PHASE-9.md](PHASE-9.md).

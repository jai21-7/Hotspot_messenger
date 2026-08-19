# Phase 1 — Security foundations (months 4–7)

Goal: speak the language of the field. This is conceptual. It is not a pentest skill by itself.

## Topics

- CIA triad (confidentiality, integrity, availability)
- Threat vs vulnerability vs risk
- Authentication vs authorization
- Hashing vs encryption (what they are *for*; not how to crack)
- Failure **catalog**: OWASP Top 10 *names and impact*, not recipes
- Hardening habits: updates, least privilege, backups, MFA, secrets not in source control

## Suggested study

- CompTIA **Security+** official objectives or Professor Messer Security+ videos (optional cert)
- OWASP Top 10 project page: read the category titles and “how to prevent” sections
- NIST or NCSC beginner cyber hygiene guides (backups, MFA, patching)

Security+ is a **hiring filter**, not proof you can test systems.

## What “catalog” means

For each OWASP Top 10 item (or similar list), you should be able to say:

1. What the class is called
2. What a user or business might lose if it is present
3. What a **defender or developer** typically changes to reduce it

You should not collect exploit steps.

## Checkpoint

- [ ] Describe how a typical web request is authenticated
- [ ] List places secrets must **not** live (chat messages, git history, client-side JS, screenshots)
- [ ] Optional: sit Security+ or finish a Security+ video series and score yourself on practice questions

## Weekly rhythm

Same as Phase 0: 3–4h Linux/network/Python, 2–3h conceptual security, 2h lab admin, 30m notes.

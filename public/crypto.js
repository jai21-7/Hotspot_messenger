// Client-side encryption — server only sees ciphertext (E2E-style for LAN chat)
const CryptoHelper = (function () {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  function bufToBase64(buf) {
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToBuf(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async function deriveKey(passphrase, scope) {
    const salt = encoder.encode(`hotspot-messenger:${scope}`);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encryptText(plaintext, passphrase, scope) {
    const key = await deriveKey(passphrase, scope);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(plaintext)
    );
    return { ciphertext: bufToBase64(cipher), iv: bufToBase64(iv) };
  }

  async function decryptText(ciphertext, iv, passphrase, scope) {
    try {
      const key = await deriveKey(passphrase, scope);
      const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(base64ToBuf(iv)) },
        key,
        base64ToBuf(ciphertext)
      );
      return decoder.decode(plain);
    } catch (error) {
      return null;
    }
  }

  async function encryptBlob(blob, passphrase, scope) {
    const key = await deriveKey(passphrase, scope);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await blob.arrayBuffer();
    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
    return { blob: new Blob([cipher]), iv: bufToBase64(iv) };
  }

  async function decryptBlob(encryptedBlob, iv, passphrase, scope, mimeType) {
    try {
      const key = await deriveKey(passphrase, scope);
      const data = await encryptedBlob.arrayBuffer();
      const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(base64ToBuf(iv)) },
        key,
        data
      );
      return new Blob([plain], { type: mimeType || "application/octet-stream" });
    } catch (error) {
      return null;
    }
  }

  function roomScope(roomId) {
    return `room:${roomId}`;
  }

  function dmScope(nameA, nameB) {
    return `dm:${[nameA, nameB].sort().join(":")}`;
  }

  // ── Phase 9: ECDH identity keys (safer DM encryption without shared passphrase) ──

  async function generateIdentityKeyPair() {
    return crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"]
    );
  }

  async function exportPublicKeyJwk(publicKey) {
    return crypto.subtle.exportKey("jwk", publicKey);
  }

  async function exportPrivateKeyJwk(privateKey) {
    return crypto.subtle.exportKey("jwk", privateKey);
  }

  async function importPublicKeyJwk(jwk) {
    return crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      []
    );
  }

  async function importPrivateKeyJwk(jwk) {
    return crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"]
    );
  }

  async function deriveSharedPassphrase(privateKey, peerPublicKey) {
    const bits = await crypto.subtle.deriveBits(
      { name: "ECDH", public: peerPublicKey },
      privateKey,
      256
    );
    return bufToBase64(bits);
  }

  async function fingerprintFromPublicJwk(jwk) {
    const raw = encoder.encode(JSON.stringify(jwk));
    const hash = await crypto.subtle.digest("SHA-256", raw);
    const bytes = new Uint8Array(hash);
    let hex = "";
    for (let i = 0; i < 8; i++) {
      hex += bytes[i].toString(16).padStart(2, "0");
      if (i % 2 === 1 && i < 7) {
        hex += " ";
      }
    }
    return hex.toUpperCase();
  }

  return {
    encryptText,
    decryptText,
    encryptBlob,
    decryptBlob,
    roomScope,
    dmScope,
    generateIdentityKeyPair,
    exportPublicKeyJwk,
    exportPrivateKeyJwk,
    importPublicKeyJwk,
    importPrivateKeyJwk,
    deriveSharedPassphrase,
    fingerprintFromPublicJwk,
  };
})();

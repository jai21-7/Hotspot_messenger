// Phase 9 — identity keys: each device has a private key; DMs auto-encrypt with ECDH
const HMIdentity = (function () {
  const STORAGE_KEY = "hm-identity-keypair";
  let privateKey = null;
  let publicJwk = null;
  let fingerprint = "";
  let ready = false;

  async function ensureKeys() {
    if (ready && privateKey && publicJwk) {
      return { publicJwk, fingerprint };
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        privateKey = await CryptoHelper.importPrivateKeyJwk(data.privateJwk);
        publicJwk = data.publicJwk;
        fingerprint = await CryptoHelper.fingerprintFromPublicJwk(publicJwk);
        ready = true;
        return { publicJwk, fingerprint };
      }
    } catch (error) {
      // regenerate below
    }

    return regenerateKeys();
  }

  async function regenerateKeys() {
    const pair = await CryptoHelper.generateIdentityKeyPair();
    privateKey = pair.privateKey;
    publicJwk = await CryptoHelper.exportPublicKeyJwk(pair.publicKey);
    const privateJwk = await CryptoHelper.exportPrivateKeyJwk(pair.privateKey);
    fingerprint = await CryptoHelper.fingerprintFromPublicJwk(publicJwk);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ publicJwk, privateJwk })
    );
    ready = true;
    return { publicJwk, fingerprint };
  }

  function getPublicJwk() {
    return publicJwk;
  }

  function getFingerprint() {
    return fingerprint;
  }

  async function deriveDmPassphrase(peerPublicJwk) {
    if (!privateKey || !peerPublicJwk) {
      return "";
    }
    try {
      const peerKey = await CryptoHelper.importPublicKeyJwk(peerPublicJwk);
      return CryptoHelper.deriveSharedPassphrase(privateKey, peerKey);
    } catch (error) {
      return "";
    }
  }

  return {
    ensureKeys,
    regenerateKeys,
    getPublicJwk,
    getFingerprint,
    deriveDmPassphrase,
  };
})();

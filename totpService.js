/**
 * Little to Large - Pure Node.js TOTP (RFC 6238 / RFC 4226) & Two-Factor Authentication Service
 * 100% Free and Open Source. Zero external dependencies. Zero paid APIs.
 * Compatible with Google Authenticator, Microsoft Authenticator, Authy, Apple Keychain.
 */

const crypto = require('crypto');

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(base32) {
  let bits = 0;
  let value = 0;
  const bytes = [];
  const clean = String(base32).toUpperCase().replace(/[^A-Z2-7]/g, '');
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_CHARS.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function generateSecret(byteLength = 20) {
  return base32Encode(crypto.randomBytes(byteLength));
}

function generateTotpToken(secret, timeStepOffset = 0) {
  const secretBuf = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / 30) + timeStepOffset;
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(timeStep));
  const hmac = crypto.createHmac('sha1', secretBuf).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, '0');
}

function verifyTotp(secret, token, window = 1) {
  if (!secret || !token) return false;
  const cleanToken = String(token).trim();
  for (let offset = -window; offset <= window; offset++) {
    if (generateTotpToken(secret, offset) === cleanToken) {
      return true;
    }
  }
  return false;
}

function generateOtpAuthUri(issuer, accountName, secret) {
  const encIssuer = encodeURIComponent(issuer);
  const encAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encIssuer}:${encAccount}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}

function generateRecoveryCodes(count = 8) {
  const codes = [];
  const hashedCodes = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
    codes.push(formatted);
    const hash = crypto.createHash('sha256').update(formatted).digest('hex');
    hashedCodes.push(hash);
  }
  return { plainCodes: codes, hashedCodes };
}

function verifyRecoveryCode(plainCode, storedHashedCodes) {
  if (!plainCode || !Array.isArray(storedHashedCodes)) return -1;
  const targetHash = crypto.createHash('sha256').update(String(plainCode).trim().toUpperCase()).digest('hex');
  return storedHashedCodes.indexOf(targetHash);
}

module.exports = {
  generateSecret,
  generateTotpToken,
  verifyTotp,
  generateOtpAuthUri,
  generateRecoveryCodes,
  verifyRecoveryCode
};

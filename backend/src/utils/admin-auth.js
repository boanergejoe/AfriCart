import crypto from "node:crypto";

import { ENV } from "../config/env.js";

const SCRYPT_KEY_LENGTH = 64;
export const ADMIN_PASSWORD_MIN_LENGTH = 5;
export const ADMIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

/** Format: scrypt$<salt-hex>$<hash-hex>. Store this in ADMIN_PASSWORD_HASH. */
export function hashAdminPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyAdminPassword(password, storedHash) {
  const [scheme, saltHex, hashHex] = String(storedHash || "").split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  try {
    const expected = Buffer.from(hashHex, "hex");
    if (!expected.length) return false;

    const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", ENV.ADMIN_SESSION_SECRET)
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

export function createAdminToken(email) {
  if (!ENV.ADMIN_SESSION_SECRET) throw new Error("ADMIN_SESSION_SECRET is not configured.");

  const issuedAt = Date.now();
  return sign({
    email: email.trim().toLowerCase(),
    iat: issuedAt,
    exp: issuedAt + ADMIN_TOKEN_TTL_MS,
  });
}

export function verifyAdminToken(token) {
  if (!ENV.ADMIN_SESSION_SECRET || typeof token !== "string") return null;

  const [body, signature, ...extra] = token.split(".");
  if (!body || !signature || extra.length) return null;

  try {
    const expected = crypto
      .createHmac("sha256", ENV.ADMIN_SESSION_SECRET)
      .update(body)
      .digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number" ||
      Date.now() >= payload.exp
    ) {
      return null;
    }

    return payload.email.trim().toLowerCase();
  } catch {
    return null;
  }
}

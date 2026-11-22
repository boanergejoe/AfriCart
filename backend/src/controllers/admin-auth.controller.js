import { ENV } from "../config/env.js";
import {
  ADMIN_PASSWORD_MIN_LENGTH,
  ADMIN_TOKEN_TTL_MS,
  createAdminToken,
  verifyAdminPassword,
} from "../utils/admin-auth.js";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const INVALID_CREDENTIALS = "Invalid email or password.";

const attempts = new Map();

function getAttemptState(key) {
  const now = Date.now();
  const state = attempts.get(key);

  if (!state || now - state.startedAt >= LOGIN_WINDOW_MS) {
    const fresh = { startedAt: now, count: 0 };
    attempts.set(key, fresh);
    return fresh;
  }

  return state;
}

function recordFailedAttempt(key) {
  getAttemptState(key).count += 1;
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function loginAdmin(req, res) {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const passwordLength = Array.from(password).length;

  if (!email || passwordLength < ADMIN_PASSWORD_MIN_LENGTH) {
    return res.status(400).json({
      message: `Enter a valid email and a password of at least ${ADMIN_PASSWORD_MIN_LENGTH} characters.`,
    });
  }

  if (!ENV.ADMIN_EMAIL || !ENV.ADMIN_PASSWORD_HASH || !ENV.ADMIN_SESSION_SECRET) {
    return res.status(503).json({ message: "Admin login is not configured." });
  }

  const configuredEmail = normalizeEmail(ENV.ADMIN_EMAIL);
  const attemptKey = `${email}|${req.ip || "unknown"}`;

  if (getAttemptState(attemptKey).count >= MAX_LOGIN_ATTEMPTS) {
    return res.status(429).json({ message: "Too many sign-in attempts. Try again in 15 minutes." });
  }

  const credentialsMatch =
    email === configuredEmail && verifyAdminPassword(password, ENV.ADMIN_PASSWORD_HASH);

  if (!credentialsMatch) {
    recordFailedAttempt(attemptKey);
    return res.status(401).json({ message: INVALID_CREDENTIALS });
  }

  attempts.delete(attemptKey);

  return res.status(200).json({
    token: createAdminToken(configuredEmail),
    email: configuredEmail,
    expiresIn: Math.floor(ADMIN_TOKEN_TTL_MS / 1000),
  });
}

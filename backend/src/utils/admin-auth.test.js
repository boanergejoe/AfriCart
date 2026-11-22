import assert from "node:assert/strict";
import test from "node:test";

process.env.ADMIN_SESSION_SECRET = "test-admin-session-secret";

const { ENV } = await import("../config/env.js");
const { loginAdmin } = await import("../controllers/admin-auth.controller.js");
const {
  createAdminToken,
  hashAdminPassword,
  verifyAdminPassword,
  verifyAdminToken,
} = await import("./admin-auth.js");

const makeResponse = () => ({
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("hashes and verifies a five-character admin password", () => {
  const password = "abcde";
  const hash = hashAdminPassword(password);

  assert.match(hash, /^scrypt\$[0-9a-f]+\$[0-9a-f]+$/);
  assert.equal(verifyAdminPassword(password, hash), true);
  assert.equal(verifyAdminPassword("abcdef", hash), false);
  assert.equal(verifyAdminPassword(password, "not-a-hash"), false);
});

test("creates and verifies a signed admin session token", () => {
  const token = createAdminToken("Admin@Example.com ");

  assert.equal(verifyAdminToken(token), "admin@example.com");
  assert.equal(verifyAdminToken(`${token}tampered`), null);
  assert.equal(verifyAdminToken("invalid"), null);
});

test("admin login accepts passwords with five characters", () => {
  ENV.ADMIN_EMAIL = "admin@example.com";
  ENV.ADMIN_PASSWORD_HASH = hashAdminPassword("abcde");

  const response = makeResponse();
  loginAdmin(
    { body: { email: " ADMIN@example.com ", password: "abcde" }, ip: "127.0.0.1" },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.email, "admin@example.com");
  assert.equal(typeof response.body.token, "string");
  assert.equal(verifyAdminToken(response.body.token), "admin@example.com");
});

test("admin login rejects passwords shorter than five characters", () => {
  ENV.ADMIN_EMAIL = "admin@example.com";
  ENV.ADMIN_PASSWORD_HASH = hashAdminPassword("abcde");

  const response = makeResponse();
  loginAdmin({ body: { email: "admin@example.com", password: "abcd" }, ip: "127.0.0.2" }, response);

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /at least 5 characters/);
});

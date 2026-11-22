import crypto from "node:crypto";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

import { ADMIN_PASSWORD_MIN_LENGTH, hashAdminPassword } from "../utils/admin-auth.js";

async function promptHidden(query) {
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    const rl = readline.createInterface({ input, output });
    try {
      return await rl.question(query);
    } finally {
      rl.close();
    }
  }

  output.write(query);
  return new Promise((resolve) => {
    let value = "";
    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");

    const finish = () => {
      input.setRawMode(false);
      input.pause();
      input.off("data", onData);
      output.write("\n");
      resolve(value);
    };

    const onData = (character) => {
      if (character === "\r" || character === "\n") {
        finish();
      } else if (character === "\u0003") {
        output.write("\n");
        process.exit(130);
      } else if (character === "\u007f" || character === "\b") {
        value = value.slice(0, -1);
      } else if (character >= " ") {
        value += character;
      }
    };

    input.on("data", onData);
  });
}

const password = await promptHidden("Admin password (at least 5 characters): ");

if (Array.from(password).length < ADMIN_PASSWORD_MIN_LENGTH) {
  console.error(`Password must be at least ${ADMIN_PASSWORD_MIN_LENGTH} characters.`);
  process.exitCode = 1;
} else {
  console.log("\nAdd these values to backend/.env (or the backend Vercel project):\n");
  console.log(`ADMIN_PASSWORD_HASH=${hashAdminPassword(password)}`);
  console.log(`ADMIN_SESSION_SECRET=${crypto.randomBytes(32).toString("base64url")}`);
  console.log("\nKeep both values secret. Rotating the session secret signs out existing admins.");
}

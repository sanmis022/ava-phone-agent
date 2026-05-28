#!/usr/bin/env node

/**
 * Quick verification script for Ava Phone Agent setup
 * Run: node verify-setup.js
 */

import fs from "fs";
import path from "path";

const checks = {
  passed: [],
  failed: [],
};

function check(name, condition, details = "") {
  if (condition) {
    checks.passed.push(name);
    console.log(`? ${name}`);
  } else {
    checks.failed.push(name);
    console.log(`? ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

console.log("\n?? Ava Phone Agent - Setup Verification\n");

// Check Node.js
check(
  "Node.js installed",
  process.version,
  `Running Node.js ${process.version}`
);

// Check required files
check(
  "server.js exists",
  fs.existsSync("server.js"),
  "Missing: server.js"
);

check(
  "package.json exists",
  fs.existsSync("package.json"),
  "Missing: package.json"
);

// Check package.json content
if (fs.existsSync("package.json")) {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

  check(
    "Dependencies installed (node_modules exists)",
    fs.existsSync("node_modules"),
    "Run: npm install"
  );

  check(
    "node-fetch in dependencies",
    pkg.dependencies && pkg.dependencies["node-fetch"],
    "Add node-fetch: npm install node-fetch"
  );

  check(
    "ws in dependencies",
    pkg.dependencies && pkg.dependencies.ws,
    "ws library missing"
  );

  check(
    "express in dependencies",
    pkg.dependencies && pkg.dependencies.express,
    "express library missing"
  );

  check(
    "dotenv in dependencies",
    pkg.dependencies && pkg.dependencies.dotenv,
    "dotenv library missing"
  );
}

// Check .env file
const envExists = fs.existsSync(".env");
check(
  ".env file exists",
  envExists,
  "Create from .env.example: cp .env.example .env"
);

if (envExists) {
  const env = fs.readFileSync(".env", "utf8");

  check(
    "OPENAI_API_KEY set",
    env.includes("OPENAI_API_KEY=sk-"),
    "Set OPENAI_API_KEY in .env"
  );

  check(
    "MAKE_WEBHOOK_URL set",
    env.includes("MAKE_WEBHOOK_URL=https://"),
    "Set MAKE_WEBHOOK_URL in .env (from make.com)"
  );
}

// Check server.js content
if (fs.existsSync("server.js")) {
  const server = fs.readFileSync("server.js", "utf8");

  check(
    "OpenAI WebSocket configured",
    server.includes("wss://api.openai.com/v1/realtime"),
    "OpenAI connection not found in server.js"
  );

  check(
    "Tools defined in session",
    server.includes("submit_contact"),
    "Tool definition missing"
  );

  check(
    "make.com webhook integration",
    server.includes("MAKE_WEBHOOK_URL"),
    "Webhook integration missing"
  );

  check(
    "Bilingual instructions present",
    server.includes("Mandarin Chinese") || server.includes("Chinese"),
    "Chinese language support missing"
  );
}

// Check documentation
check(
  "QUICK_START.md exists",
  fs.existsSync("QUICK_START.md"),
  "Missing: QUICK_START.md"
);

check(
  "MVP_SETUP.md exists",
  fs.existsSync("MVP_SETUP.md"),
  "Missing: MVP_SETUP.md"
);

check(
  "MAKE_COM_SETUP.md exists",
  fs.existsSync("MAKE_COM_SETUP.md"),
  "Missing: MAKE_COM_SETUP.md"
);

// Summary
console.log("\n" + "=".repeat(50));
console.log(`\n? Passed: ${checks.passed.length} checks`);
console.log(`? Failed: ${checks.failed.length} checks\n`);

if (checks.failed.length === 0) {
  console.log("?? All checks passed! You're ready to go.\n");
  console.log("Next steps:");
  console.log("  1. Update .env with your API keys");
  console.log("  2. Run: npm install");
  console.log("  3. Run: npm start");
  console.log("  4. Call your Twilio number to test\n");
  process.exit(0);
} else {
  console.log("??  Please fix the failed checks above.\n");
  console.log("Need help? Check out:");
  console.log("  - QUICK_START.md (5 min setup)");
  console.log("  - MVP_SETUP.md (detailed guide)");
  console.log("  - MAKE_COM_SETUP.md (make.com config)\n");
  process.exit(1);
}

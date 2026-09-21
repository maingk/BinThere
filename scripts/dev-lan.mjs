#!/usr/bin/env node
/**
 * Starts the dev server reachable from other devices on the LAN, so a phone
 * can scan a QR label and actually load the page.
 *
 * QR codes encode NEXT_PUBLIC_APP_URL, so that has to be the Mac's LAN
 * address rather than localhost -- otherwise the phone resolves "localhost"
 * to itself and gets nothing. The address is detected at startup so a DHCP
 * change doesn't silently produce dead QR codes.
 */
import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";

const PORT = process.env.PORT ?? "3000";

function lanAddress() {
  const candidates = [];
  for (const [name, addrs] of Object.entries(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family !== "IPv4" || addr.internal) continue;
      // Link-local addresses aren't routable from another device.
      if (addr.address.startsWith("169.254.")) continue;
      candidates.push({ name, address: addr.address });
    }
  }
  return candidates;
}

const found = lanAddress();

if (found.length === 0) {
  console.error("No LAN address found. Are you connected to a network?");
  process.exit(1);
}

// Honour an explicit override, otherwise take the first usable address.
const chosen = process.env.LAN_HOST ?? found[0].address;
const origin = `http://${chosen}:${PORT}`;

console.log("\n  Interfaces found:");
for (const { name, address } of found) {
  const mark = address === chosen ? "->" : "  ";
  console.log(`   ${mark} ${name.padEnd(6)} ${address}`);
}
console.log(`\n  Serving on ${origin}`);
console.log("  QR labels generated now will encode that address.\n");
console.log("  Two things must match it:");
console.log(`    1. Supabase redirect URL: ${origin}/auth/callback`);
console.log("    2. Your phone on the same network as this Mac\n");
console.log("  Override the address with: LAN_HOST=192.168.68.76 npm run dev:lan\n");

const child = spawn(
  "npx",
  ["next", "dev", "--hostname", "0.0.0.0", "--port", PORT],
  {
    stdio: "inherit",
    env: { ...process.env, NEXT_PUBLIC_APP_URL: origin },
  },
);

child.on("exit", (code) => process.exit(code ?? 0));

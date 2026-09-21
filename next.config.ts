import { networkInterfaces } from "node:os";

import type { NextConfig } from "next";

/**
 * Private IPv4 addresses of this machine.
 *
 * Next blocks cross-origin requests to dev resources (including the HMR
 * endpoint) unless the origin is listed in allowedDevOrigins. When a phone
 * loads the dev server over the LAN, that block stops React from hydrating,
 * and the failure is silent and very misleading: forms still render, but a
 * submit falls through to the browser's native handler, reloading the page
 * and discarding the input rather than reporting anything.
 *
 * Detected rather than hardcoded so a DHCP change doesn't resurrect it.
 * allowedDevOrigins has no effect on production builds.
 */
function lanOrigins(): string[] {
  const origins = new Set<string>();

  for (const addrs of Object.values(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family !== "IPv4" || addr.internal) continue;
      const ip = addr.address;
      const isPrivate =
        ip.startsWith("10.") ||
        ip.startsWith("192.168.") ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
      if (isPrivate) origins.add(ip);
    }
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  allowedDevOrigins: lanOrigins(),
};

export default nextConfig;

import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

// This is a monorepo: the shared .env lives at the repository root, while
// Next.js only auto-loads .env* from the app directory. Load the root env at
// build time so NEXT_PUBLIC_* addresses are inlined into the client bundle.
const rootEnvDir = path.resolve(process.cwd(), "../..");
const rootEnvFile = path.join(rootEnvDir, ".env");
if (fs.existsSync(rootEnvFile)) {
  for (const line of fs.readFileSync(rootEnvFile, "utf8").split("\n")) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
};

export default nextConfig;

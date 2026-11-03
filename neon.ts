import { defineConfig } from "@neon/config/v1";

// Origin browser yang boleh membuka koneksi Realtime.
// Tambahkan domain produksi lewat REALTIME_ALLOWED_ORIGINS saat deploy.
const allowedOrigins = (
  process.env.REALTIME_ALLOWED_ORIGINS ??
  "http://localhost:3000,http://localhost:3100"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export default defineConfig({
  // Declare your Neon services here
  preview: {
    realtime: {
      allowedOrigins,
    },
  },
  auth: true,
  functions: {
    hello: {
      name: "Hello World",
      source: "./hello.ts",
      env: {
        INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET!,
      },
    },
  },
  buckets: {
    // "private" is the default; use "public_read" for anonymous reads
    assets: { access: "private" },
  },
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: "7d" };
    }
    // Existing branch: no changes
    return {};
  },
});

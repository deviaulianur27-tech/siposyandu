import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@neon/realtime",
    "bcryptjs",
    "files-sdk",
    "pg",
  ],
};

export default nextConfig;

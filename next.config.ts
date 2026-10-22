import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit'],
  experimental: {
    // Custom sign uploads go through a server action (default cap 1 MB). Keep in step with features/inventory/limits.ts.
    serverActions: { bodySizeLimit: '5mb' },
  },
};

export default nextConfig;

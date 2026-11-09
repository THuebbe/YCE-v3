import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit'],
  // Google Pay in Stripe's payment form: some browsers (Chrome on Android)
  // need the page to allow Stripe's frame to use the Payment Request API
  async headers() {
    return [{
      source: '/:path*',
      headers: [{ key: 'Permissions-Policy', value: 'payment=(self "https://js.stripe.com")' }],
    }];
  },
  experimental: {
    // Custom sign uploads go through a server action (default cap 1 MB). Keep in step with features/inventory/limits.ts.
    serverActions: { bodySizeLimit: '5mb' },
  },
};

export default nextConfig;

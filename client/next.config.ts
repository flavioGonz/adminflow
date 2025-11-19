import type { NextConfig } from "next";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  i18n: {
    defaultLocale: "es",
    locales: ["es"],
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: "/api/auth/:path*",
      },
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

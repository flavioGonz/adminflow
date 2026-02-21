import type { NextConfig } from "next";

const backendFromEnv = process.env.INTERNAL_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL;
const BACKEND_URL = backendFromEnv
  ? backendFromEnv.replace(/\/api\/?$/, "")
  : "http://localhost:5000";

const nextConfig: NextConfig = {
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
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
      {
        source: "/assets/:path*",
        destination: `${BACKEND_URL}/assets/:path*`,
      },
    ];
  },
};

export default nextConfig;

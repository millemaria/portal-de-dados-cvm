import type { NextConfig } from "next";

const API_PORT = process.env.API_PORT || "3001";
const API_URL = process.env.API_URL || `http://127.0.0.1:${API_PORT}`;

const nextConfig: NextConfig = {
  transpilePackages: ["@portal-cvm/types", "@portal-cvm/validation"],
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/companies/:path*",
        destination: `${API_URL}/api/companies/:path*`,
      },
      {
        source: "/api/companies",
        destination: `${API_URL}/api/companies`,
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["*.ngrok-free.app", "*.ngrok.app", "*.ngrok.io", "localhost:3000"],
    },
  },
};

export default nextConfig;


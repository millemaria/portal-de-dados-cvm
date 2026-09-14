import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@portal-cvm/types"],
  output: "standalone",
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopackは日本語パスで問題があるためWebpackを使用
  turbopack: undefined,
};

export default nextConfig;

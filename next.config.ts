import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack を明示的に有効化（webpack config と共存するために必要）
  turbopack: {},
  // @vercel/og (OG画像生成) を使っていないため、巨大なWASMバンドルを除外して
  // Cloudflare Workers の 3 MiB サイズ制限に収める
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        "@vercel/og": false,
      };
    }
    return config;
  },
};

export default nextConfig;

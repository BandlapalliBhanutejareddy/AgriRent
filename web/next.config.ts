import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === 'true' || process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  ...(isStaticExport ? {
    output: 'export',
    images: { unoptimized: true },
    trailingSlash: true,
  } : {}),
  allowedDevOrigins: ['192.168.1.148', 'localhost']
};

export default nextConfig;

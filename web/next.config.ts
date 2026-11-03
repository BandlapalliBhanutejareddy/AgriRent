import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === 'true' || process.env.GITHUB_PAGES === 'true';
const basePath = process.env.BASE_PATH || (process.env.GITHUB_PAGES === 'true' ? '/AgriRent' : undefined);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath || '',
  },
  ...(isStaticExport ? {
    output: 'export',
    images: { unoptimized: true },
    trailingSlash: true,
  } : {}),
  ...(basePath ? {
    basePath,
  } : {}),
  allowedDevOrigins: ['192.168.1.148', 'localhost']
};

export default nextConfig;

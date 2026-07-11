import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Playwright drives the dev server via 127.0.0.1; without this Next.js 16
  // blocks it as a cross-origin dev request, which breaks hydration and HMR.
  allowedDevOrigins: ['127.0.0.1'],
};

export default nextConfig;

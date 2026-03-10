import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // Enable React Strict Mode for better development warnings
  reactStrictMode: true,
  
  // Security headers (additional to middleware)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ];
  },
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // TypeScript configuration - DO NOT ignore build errors in production
  typescript: {
    // Only ignore in development for faster builds
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  // Enable experimental features for better security
  experimental: {
    // Enable server actions security
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
};

export default nextConfig;

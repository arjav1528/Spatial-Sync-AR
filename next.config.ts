import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://app.showpad.biz',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.showpad.biz",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

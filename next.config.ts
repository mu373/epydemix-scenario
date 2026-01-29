import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://minami-box-1:8001"}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

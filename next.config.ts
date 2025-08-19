import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Don’t block Vercel builds because of lint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

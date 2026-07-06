import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yjrwnatbusouwzbvmcnb.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    // Admin image uploads POST the processed image through a Server Action;
    // the default 1MB body limit is too small for a ~1600px PNG cut-out.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;

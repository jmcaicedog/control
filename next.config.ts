import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["@dnd-kit/core", "@dnd-kit/sortable", "date-fns"],
  },
};

export default nextConfig;

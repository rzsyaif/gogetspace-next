import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // shared workspace packages ship TypeScript source
  transpilePackages: ["@gogetspace/baseplate", "@gogetspace/modules"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig

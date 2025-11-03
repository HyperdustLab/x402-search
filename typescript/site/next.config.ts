import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // instrumentation.ts is available by default in Next.js 15+
  // No need for experimental.instrumentationHook
  
  // Externalize better-sqlite3 so it's not bundled by webpack
  // This allows the native module to be loaded correctly at runtime
  serverExternalPackages: ["better-sqlite3"],
  
  env: {
    RESOURCE_WALLET_ADDRESS: process.env.RESOURCE_WALLET_ADDRESS,
    NEXT_PUBLIC_FACILITATOR_URL: process.env.NEXT_PUBLIC_FACILITATOR_URL,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    NETWORK: process.env.NETWORK,
  },
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // Externalize better-sqlite3 on the server side
    // Use a function to properly externalize the module
    if (isServer) {
      const originalExternals = config.externals;
      config.externals = [
        ...(typeof originalExternals === "undefined" ? [] : Array.isArray(originalExternals) ? originalExternals : [originalExternals]),
        ({ request }, callback) => {
          if (request === "better-sqlite3") {
            return callback(undefined, `commonjs ${request}`);
          }
          if (typeof originalExternals === "function") {
            return originalExternals({ request }, callback);
          }
          callback();
        },
      ];
    }

    return config;
  },
};

export default nextConfig;

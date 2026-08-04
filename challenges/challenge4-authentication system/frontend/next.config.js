const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode — prevents double-invoke of effects in dev
  // which causes WebSocket connections to join/leave rooms twice.
  reactStrictMode: false,

  // Webpack deduplication (used by `next build` and non-turbo dev).
  // Turbopack handles yjs deduplication automatically — no alias needed.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        yjs: path.resolve(__dirname, 'node_modules/yjs'),
      };
    }
    return config;
  },
};

module.exports = nextConfig;

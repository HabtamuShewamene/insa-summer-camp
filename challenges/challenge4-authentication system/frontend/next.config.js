/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode — prevents double-invoke of effects in dev
  // which causes WebSocket connections to join/leave rooms twice.
  reactStrictMode: false,
};

module.exports = nextConfig;

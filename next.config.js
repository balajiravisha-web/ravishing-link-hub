// next.config.js
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Allow imports like "@/lib/…"
    config.resolve.alias["@" ] = path.resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;

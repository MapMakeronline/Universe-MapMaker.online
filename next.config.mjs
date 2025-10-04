import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // Fix for multiple lockfiles warning
  outputFileTracingRoot: path.join(__dirname),

  transpilePackages: ['mapbox-gl'],

  images: {
    unoptimized: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules\/mapbox-gl/,
      type: 'javascript/auto',
    })
    return config
  },
}

export default nextConfig

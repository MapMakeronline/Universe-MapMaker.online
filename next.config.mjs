import path from 'path';
import { fileURLToPath } from 'url';
import bundleAnalyzer from '@next/bundle-analyzer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📊 BUNDLE ANALYZER - Visualize what's in your bundle
// Run: ANALYZE=true npm run build
// Opens interactive treemap in browser showing bundle composition
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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

  // Force environment variables to be available at build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online',
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  },

  // 🌳 TREE-SHAKING - Automatic modular imports for MUI
  // Transforms: import { Button } from '@mui/material'
  // Into:       import Button from '@mui/material/Button'
  // Result:     Only loads components you actually use (not entire MUI library!)
  // Bundle size reduction: ~10-15% for typical apps
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
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

export default withBundleAnalyzer(nextConfig);

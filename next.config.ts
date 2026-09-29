import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';
import { IMAGES_CONFIG } from './src/lib/images';

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  // образ стенда запускает `node server.js` из `.next/standalone` без полного node_modules
  output: 'standalone',
  images: IMAGES_CONFIG,
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });

import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';
import { HERO_QUALITY } from './src/lib/images';

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  images: {
    // оптимизатор отдает только файлы медиатеки Payload: адрес с чужим путем или параметрами получит 400
    localPatterns: [{ pathname: '/api/media/file/**', search: '' }],
    formats: ['image/avif', 'image/webp'],
    qualities: [HERO_QUALITY, 75],
  },
  experimental: {
    inlineCss: process.env.LAB_INLINE_CSS === '1',
  },
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });

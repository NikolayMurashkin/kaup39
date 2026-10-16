import type { MetadataRoute } from 'next';
import { OWNERS_ORIGIN } from '@/lib/consts';
import { isStand } from '@/lib/stand';

// без этого robots.txt собрался бы один раз при сборке, и окружение стенда на него бы не влияло
export const dynamic = 'force-dynamic';

const robots = (): MetadataRoute.Robots =>
  isStand()
    ? { rules: { userAgent: '*', disallow: '/' } }
    : { rules: { userAgent: '*', allow: '/' }, sitemap: new URL('/sitemap.xml', OWNERS_ORIGIN).href };

export default robots;

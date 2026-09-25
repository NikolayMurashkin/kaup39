import type { MetadataRoute } from 'next';
import { isStand } from '@/lib/stand';

// без этого robots.txt собрался бы один раз при сборке, и окружение стенда на него бы не влияло
export const dynamic = 'force-dynamic';

const robots = (): MetadataRoute.Robots => ({
  rules: isStand() ? { userAgent: '*', disallow: '/' } : { userAgent: '*', allow: '/' },
});

export default robots;

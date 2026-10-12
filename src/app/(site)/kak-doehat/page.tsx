import type { Metadata } from 'next';
import { getDirectionsPage } from '@/cms/directions';
import { SiteFrame } from '@/components/SiteFrame';
import { getTheme } from '@/lib/theme';
import { DIRECTIONS_TITLE } from './consts';
import { DirectionsContent } from './DirectionsContent';
import { directionsParts } from './parts';

export const generateMetadata = async (): Promise<Metadata> => {
  const { site, page } = await getDirectionsPage();

  return { title: `${page?.title ?? DIRECTIONS_TITLE} — ${site.name}`, description: page?.lead ?? site.address };
};

const DirectionsPage = async () => {
  const [{ site, page }, theme] = await Promise.all([getDirectionsPage(), getTheme()]);
  const { latitude, longitude } = site.map ?? {};

  return (
    <SiteFrame
      site={site}
      theme={theme}
      fullBleed
    >
      <DirectionsContent
        title={page?.title ?? DIRECTIONS_TITLE}
        lead={page?.lead ?? null}
        address={site.address}
        map={latitude != null && longitude != null ? { latitude, longitude } : null}
        parts={directionsParts(page?.sections)}
        place={site.name}
      />
    </SiteFrame>
  );
};

export default DirectionsPage;

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { HOME_ANCHORS } from '@/cms/consts';
import { getHome } from '@/cms/home';
import { toPhoto } from '@/cms/media';
import { CmsSections } from '@/components/CmsSections';
import { Ornament } from '@/components/Ornament';
import { SiteFrame } from '@/components/SiteFrame';
import { getTheme } from '@/lib/theme';
import { STRIP_LIMIT } from './_home/consts';
import { Hero } from './_home/Hero';
import { Taverns } from './_home/Taverns';
import { transferOf } from './_home/transfer';
import { TravelTiles } from './_home/TravelTiles';
import { UpcomingDates } from './_home/UpcomingDates';
import { ZonesGrid } from './_home/ZonesGrid';

export const generateMetadata = async (): Promise<Metadata> => {
  const { site, page } = await getHome();

  return { title: site.name, description: page?.lead ?? site.tagline ?? undefined };
};

const HomePage = async () => {
  const [{ site, page, directions, zones, taverns, upcoming }, theme] = await Promise.all([getHome(), getTheme()]);
  const sections = page?.sections ?? [];
  const sectionOf = (anchor: string) => sections.find((section) => section.anchor === anchor);
  const events = sectionOf(HOME_ANCHORS.events);
  const kitchen = sectionOf(HOME_ANCHORS.kitchen);

  // данные коллекций встают в разделы с этими якорями, а если такого раздела нет — в конец страницы
  const extras: Record<string, ReactNode> = {
    [HOME_ANCHORS.zones]: (
      <ZonesGrid
        zones={zones}
        taverns={taverns}
        kitchen={kitchen?.heading ? { anchor: HOME_ANCHORS.kitchen, heading: kitchen.heading } : null}
      />
    ),
    [HOME_ANCHORS.kitchen]: <Taverns taverns={taverns} />,
  };
  const orphans = Object.keys(extras).filter((anchor) => !sectionOf(anchor));

  return (
    <SiteFrame
      site={site}
      theme={theme}
    >
      <Hero
        title={page?.title ?? site.name}
        lead={page?.lead}
        photo={toPhoto(theme === 'light' ? page?.hero?.photoDay : page?.hero?.photoNight)}
        credit={site.name}
        next={upcoming[0] ?? null}
      />

      <Ornament />

      {upcoming.length ? (
        <UpcomingDates
          items={upcoming.slice(0, STRIP_LIMIT)}
          anchor={HOME_ANCHORS.events}
          heading={events?.heading}
          note={events?.blockType === 'text' ? events.body : null}
        />
      ) : null}

      <CmsSections
        sections={sections}
        extras={extras}
        skip={[HOME_ANCHORS.events]}
      />

      {orphans.map((anchor) => (
        <section key={anchor}>{extras[anchor]}</section>
      ))}

      <Ornament />

      <TravelTiles
        address={site.address}
        transfer={transferOf(directions)}
      />
    </SiteFrame>
  );
};

export default HomePage;

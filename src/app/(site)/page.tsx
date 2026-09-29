import type { Metadata } from 'next';
import { HOME_ANCHORS } from '@/cms/consts';
import { getHome } from '@/cms/home';
import { toPhoto } from '@/cms/photo';
import type { PageSection, Photo } from '@/cms/types';
import { FirstScreen } from '@/components/FirstScreen';
import { SiteFrame } from '@/components/SiteFrame';
import { SCHEDULE_PATH } from '@/lib/consts';
import { getTheme } from '@/lib/theme';
import { About } from './_home/About';
import { eventCards, firstScreen, teaserCards } from './_home/cards';
import { FALLBACK_HEADINGS, KICKERS } from './_home/consts';
import { ExtraSections } from './_home/ExtraSections';
import { Gallery } from './_home/Gallery';
import { Kitchen } from './_home/Kitchen';
import { SeasonEvents } from './_home/SeasonEvents';
import { Trip } from './_home/Trip';
import { Zones } from './_home/Zones';

export const generateMetadata = async (): Promise<Metadata> => {
  const { site, page } = await getHome();

  return { title: site.name, description: page?.lead ?? site.tagline ?? undefined };
};

const textOf = (section: PageSection | undefined) => (section?.blockType === 'text' ? section : undefined);

/**
 * Главная по артборду v2 — хаб: первый экран с кадром и ближайшей датой, события сезона, «о поселении», площадки,
 * кухня с тавернами, галерея и тизеры страниц «как доехать», кемпинга и корпоративов. Тексты разделов берутся
 * из разделов CMS с якорями `HOME_ANCHORS`, раздел с другим якорем встает перед тизерами как обычный.
 */
const HomePage = async () => {
  const [{ site, page, teaserPages, events, zones, taverns, upcoming, lastDate }, theme] = await Promise.all([
    getHome(),
    getTheme(),
  ]);
  const sections = page?.sections ?? [];
  const sectionOf = (anchor: string) => sections.find((section) => section.anchor === anchor);
  const about = textOf(sectionOf(HOME_ANCHORS.about));
  const eventsText = textOf(sectionOf(HOME_ANCHORS.events));
  const zonesText = textOf(sectionOf(HOME_ANCHORS.zones));
  const kitchen = textOf(sectionOf(HOME_ANCHORS.kitchen));
  const trip = textOf(sectionOf(HOME_ANCHORS.trip));
  const gallerySection = sectionOf(HOME_ANCHORS.gallery);
  const gallery = gallerySection?.blockType === 'photos' ? gallerySection : undefined;
  const galleryPhotos = (gallery?.photos ?? []).map(toPhoto).filter((photo): photo is Photo => photo !== null);
  const screen = firstScreen(upcoming, lastDate);

  return (
    <SiteFrame
      site={site}
      theme={theme}
      fullBleed
    >
      <FirstScreen
        photos={{ dark: toPhoto(page?.hero?.photoNight), light: toPhoto(page?.hero?.photoDay) }}
        theme={theme}
        title={page?.title ?? site.name}
        lead={page?.lead}
        runes={KICKERS.firstScreen}
        credit={`фото: ${site.name}`}
        next={screen.next}
        seasonClosed={screen.seasonClosed}
        scheduleHref={SCHEDULE_PATH}
        phone={site.phone}
      />

      {events.length ? (
        <SeasonEvents
          anchor={HOME_ANCHORS.events}
          heading={eventsText?.heading ?? FALLBACK_HEADINGS.events}
          body={eventsText?.body}
          cards={eventCards(events, upcoming, lastDate)}
        />
      ) : null}

      {about?.heading ? (
        <About
          anchor={HOME_ANCHORS.about}
          heading={about.heading}
          body={about.body}
          address={site.address}
        />
      ) : null}

      {zones.length ? (
        <Zones
          anchor={HOME_ANCHORS.zones}
          heading={zonesText?.heading ?? FALLBACK_HEADINGS.zones}
          body={zonesText?.body}
          zones={zones}
        />
      ) : null}

      {taverns.length ? (
        <Kitchen
          anchor={HOME_ANCHORS.kitchen}
          heading={kitchen?.heading ?? FALLBACK_HEADINGS.kitchen}
          body={kitchen?.body}
          photo={toPhoto(kitchen?.photo)}
          taverns={taverns}
        />
      ) : null}

      {galleryPhotos.length ? (
        <Gallery
          anchor={HOME_ANCHORS.gallery}
          heading={gallery?.heading ?? FALLBACK_HEADINGS.gallery}
          photos={galleryPhotos}
        />
      ) : null}

      <ExtraSections sections={sections} />

      <Trip
        anchor={HOME_ANCHORS.trip}
        heading={trip?.heading ?? FALLBACK_HEADINGS.trip}
        body={trip?.body}
        teasers={teaserCards(teaserPages)}
      />
    </SiteFrame>
  );
};

export default HomePage;

import { toPhoto } from '@/cms/photo';
import type { Photo, ScheduleItem } from '@/cms/types';
import { upcoming } from '@/cms/upcoming';
import { FirstScreen } from '@/components/FirstScreen';
import { DEFAULT_THEME, SCHEDULE_PATH } from '@/lib/consts';
import { eventJsonLd, jsonLdScript } from '@/lib/event-jsonld';
import { paragraphs } from '@/lib/format';
import type { Theme } from '@/lib/types';
import type { Event, Site } from '@/payload-types';
import { FILTER_PARAMS } from '../../../_schedule/consts';
import { NEXT_LABEL, PHOTO_CREDIT_PREFIX } from '../consts';
import { eventKind, heroNext } from '../view';
import { About } from './About';
import { Dates } from './Dates';
import { EventGallery } from './EventGallery';
import { Includes } from './Includes';
import { hasRefund, Refund } from './Refund';
import { Way } from './Way';

export type EventContentProps = {
  event: Event;
  /** Все даты события по порядку; показываются только те, что еще не закончились к `now`. */
  dates: ScheduleItem[];
  site: Site;
  now: Date;
  /** Тема страницы: кадр первого экрана этой темы грузится сразу. */
  theme?: Theme;
};

/**
 * Страница события по артборду v2 внутри `SiteFrame`: первый экран с ближайшей датой и кассой, даты и цена
 * с льготами, «о событии», «что входит», галерея с просмотром, «как добраться» с картой по клику и возврат билета
 * через кассу Radario. Раздела без данных в CMS нет. Будущих дат нет (сезон закрыт) — пустое состояние с телефоном
 * владельцев и без разметки JSON-LD: ей нечего описывать.
 */
export const EventContent = ({ event, dates, site, now, theme = DEFAULT_THEME }: EventContentProps) => {
  const future = upcoming(dates, now);
  const last = dates.at(-1);
  const hero = heroNext(event, future, last);
  const photo = toPhoto(event.hero) ?? toPhoto(event.photo);
  const gallery = (event.gallery ?? []).map(toPhoto).filter((shot): shot is Photo => shot !== null);
  const description = paragraphs(event.description);
  const includes = event.includes ?? [];
  const extras = event.extras ?? [];
  const { latitude, longitude } = site.map ?? {};
  const jsonLd = eventJsonLd(
    {
      title: event.title,
      ticketUrl: event.ticketUrl,
      tariffs: event.tariffs,
      dates,
      place: { name: site.name, address: site.address },
    },
    now,
  );

  return (
    <>
      <FirstScreen
        photos={{ dark: photo, light: photo }}
        theme={theme}
        size="page"
        kind={eventKind(event)}
        title={event.title}
        lead={event.summary}
        credit={photo ? `${PHOTO_CREDIT_PREFIX}${site.name}` : undefined}
        nextLabel={NEXT_LABEL}
        next={hero.next}
        seasonClosed={hero.seasonClosed}
        scheduleHref={hero.next ? `${SCHEDULE_PATH}?${FILTER_PARAMS.event}=${event.slug}` : SCHEDULE_PATH}
        phone={site.phone}
      />

      <Dates
        event={event}
        upcoming={future}
        last={last}
        phone={site.phone}
      />

      {description.length ? (
        <About
          paragraphs={description}
          place={site.name}
        />
      ) : null}

      {includes.length || extras.length ? (
        <Includes
          includes={includes}
          extras={extras}
        />
      ) : null}

      {gallery.length ? <EventGallery photos={gallery} /> : null}

      <Way
        address={site.address}
        map={latitude != null && longitude != null ? { latitude, longitude } : null}
        place={site.name}
      />

      {site.refund && hasRefund(site.refund) ? <Refund refund={site.refund} /> : null}

      {jsonLd.length ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
        />
      ) : null}
    </>
  );
};

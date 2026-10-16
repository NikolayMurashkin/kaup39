import { toPhoto } from '@/cms/photo';
import { CmsSections } from '@/components/CmsSections';
import { FirstScreen } from '@/components/FirstScreen';
import type { FirstScreenFacts } from '@/components/FirstScreen/types';
import { Section } from '@/components/Section';
import { DEFAULT_THEME, SCHEDULE_PATH } from '@/lib/consts';
import { paragraphs, phoneHref } from '@/lib/format';
import type { Theme } from '@/lib/types';
import type { Page, Site } from '@/payload-types';
import {
  CORPORATE_KICKERS,
  CORPORATE_TITLE,
  FACTS_LABEL,
  HERO_ACTIONS,
  PHOTO_CREDIT_PREFIX,
  REQUEST_ANCHOR,
} from '../consts';
import { corporateParts, rentPrices, rentUnit } from '../parts';
import type { CorporateReview } from '../types';
import { Cards } from './Cards';
import { Formats } from './Formats';
import { Longhouse } from './Longhouse';
import { Offer } from './Offer';
import { Photos } from './Photos';
import { Rent } from './Rent';
import { Request } from './Request';
import { Reviews } from './Reviews';

export type CorporateContentProps = {
  page: Page | null;
  site: Site;
  /** Отзывы гостей; пусто — раздела отзывов нет. */
  reviews: CorporateReview[];
  /** Тема страницы: кадр первого экрана этой темы грузится сразу. */
  theme?: Theme;
};

/**
 * Страница корпоративов по артборду внутри `SiteFrame`: первый экран с вместимостью, ценой аренды за час и путем
 * к заявке, оффер, что можно провести, Длинный дом, огненное шоу, питание, аренда поселения, фото мероприятий,
 * отзывы (только настоящие) и форма заявки. Нет раздела — нет части; форма есть всегда, рядом — телефон владельцев.
 */
export const CorporateContent = ({ page, site, reviews, theme = DEFAULT_THEME }: CorporateContentProps) => {
  const parts = corporateParts(page?.sections);
  const prices = rentPrices(parts.rentPrices);
  const [price] = prices;
  const [capacityValue, ...capacityDetails] = (parts.capacity?.items ?? []).map(({ title }) => title);
  const photos = { dark: toPhoto(page?.hero?.photoNight), light: toPhoto(page?.hero?.photoDay) };
  const lead = paragraphs(page?.lead);
  const facts: FirstScreenFacts | undefined =
    capacityValue || price
      ? {
          label: FACTS_LABEL,
          value: capacityValue,
          details: capacityDetails,
          price: price ? { value: price.amount, note: rentUnit(price) ?? undefined } : undefined,
        }
      : undefined;
  const requestAnchor = parts.request?.anchor ?? REQUEST_ANCHOR;

  return (
    <>
      <FirstScreen
        photos={photos}
        theme={theme}
        size="page"
        runes={CORPORATE_KICKERS.head}
        title={page?.title ?? CORPORATE_TITLE}
        credit={photos[theme] ? `${PHOTO_CREDIT_PREFIX}${site.name}` : undefined}
        next={null}
        facts={facts}
        actions={[
          { label: HERO_ACTIONS.request, href: `#${requestAnchor}` },
          { label: HERO_ACTIONS.call, href: phoneHref(site.phone) },
        ]}
        scheduleHref={SCHEDULE_PATH}
        phone={site.phone}
      />

      {lead.length || parts.newYear ? (
        <Offer
          lead={lead}
          newYear={parts.newYear}
        />
      ) : null}

      {parts.formats ? <Formats formats={parts.formats} /> : null}

      {parts.longhouse || parts.capacity ? (
        <Longhouse
          longhouse={parts.longhouse}
          capacity={parts.capacity}
          price={price ?? null}
        />
      ) : null}

      {parts.fireShow ? (
        <Cards
          list={parts.fireShow}
          kicker={CORPORATE_KICKERS.fireShow}
        />
      ) : null}

      {parts.food ? (
        <Cards
          list={parts.food}
          kicker={CORPORATE_KICKERS.food}
        />
      ) : null}

      {parts.rent || parts.rentPrices ? (
        <Rent
          rent={parts.rent}
          prices={parts.rentPrices}
          phone={site.phone}
        />
      ) : null}

      {parts.photos ? <Photos photos={parts.photos} /> : null}

      {parts.rest.length ? (
        <Section>
          <CmsSections sections={parts.rest} />
        </Section>
      ) : null}

      <Reviews reviews={reviews} />

      <Request
        request={parts.request}
        phone={site.phone}
      />
    </>
  );
};

import { Fragment } from 'react';
import { toPhoto } from '@/cms/photo';
import { CmsSections } from '@/components/CmsSections';
import { PageHead } from '@/components/PageHead';
import { Section } from '@/components/Section';
import { DEFAULT_THEME } from '@/lib/consts';
import { NBSP, paragraphs, typograph } from '@/lib/format';
import type { Theme } from '@/lib/types';
import type { Page, Site } from '@/payload-types';
import { CAMPING_KICKERS, CAMPING_TITLE, FACTS_LABEL } from '../consts';
import { campingFactRows, campingParts } from '../parts';
import { Booking } from './Booking';
import styles from './CampingContent.module.scss';
import { HeadPhoto } from './HeadPhoto';
import { Photos } from './Photos';
import { Prices } from './Prices';
import { Services } from './Services';

export type CampingContentProps = {
  page: Page | null;
  site: Site;
  /** Тема страницы: кадр шапки этой темы грузится сразу. */
  theme?: Theme;
};

/**
 * Страница кемпинга по артборду v2 внутри `SiteFrame`: шапка с описанием, строкой цен и кадром, аренда места,
 * услуги, фото с просмотром, бронирование по телефону и разделы, которых код не знает. Нет раздела — нет части;
 * бронирование есть всегда: без раздела «Телефон» звонят по общему номеру владельцев.
 */
export const CampingContent = ({ page, site, theme = DEFAULT_THEME }: CampingContentProps) => {
  const parts = campingParts(page?.sections);
  const description = paragraphs(parts.description?.body);
  const facts = campingFactRows(parts.prices);
  const photos = { dark: toPhoto(page?.hero?.photoNight), light: toPhoto(page?.hero?.photoDay) };

  return (
    <>
      <PageHead
        kicker={CAMPING_KICKERS.head}
        title={typograph(page?.title ?? CAMPING_TITLE)}
        lead={description.length || !page?.lead ? null : typograph(page.lead)}
        facts={
          <>
            {description.length ? (
              <div className={styles.description}>
                {description.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
            {facts.length ? (
              <p className={styles.facts}>
                <span className={styles.caps}>{FACTS_LABEL}</span>
                <span className={styles.muted}>
                  {facts.map(({ label, amount }, index) => (
                    <Fragment key={`${index}-${label}`}>
                      {index ? ', ' : null}
                      {typograph(label)}
                      {`${NBSP}— `}
                      <span className={styles.amount}>
                        {amount}
                        {NBSP}
                        <span className={styles.rub}>₽</span>
                      </span>
                    </Fragment>
                  ))}
                </span>
              </p>
            ) : null}
          </>
        }
        aside={
          photos.dark || photos.light ? (
            <HeadPhoto
              photos={photos}
              theme={theme}
            />
          ) : null
        }
      />

      {parts.prices ? <Prices prices={parts.prices} /> : null}
      {parts.services ? <Services services={parts.services} /> : null}
      {parts.photos ? <Photos photos={parts.photos} /> : null}

      <Booking
        booking={parts.booking}
        phone={site.phone}
      />

      {parts.rest.length ? (
        <Section>
          <CmsSections sections={parts.rest} />
        </Section>
      ) : null}
    </>
  );
};

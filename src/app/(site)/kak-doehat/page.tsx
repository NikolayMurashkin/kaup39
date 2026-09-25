import type { Metadata } from 'next';
import { getDirectionsPage } from '@/cms/directions';
import { CmsSections } from '@/components/CmsSections';
import { MapEmbed } from '@/components/MapEmbed';
import { SiteFrame } from '@/components/SiteFrame';
import { typograph } from '@/lib/format';
import { getTheme } from '@/lib/theme';
import { DIRECTIONS_TITLE } from './consts';
import styles from './page.module.scss';

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
    >
      <header className={styles.intro}>
        <h1 className={styles.title}>{typograph(page?.title ?? DIRECTIONS_TITLE)}</h1>
        {page?.lead ? <p className={styles.lead}>{typograph(page.lead)}</p> : null}
      </header>

      <section
        className={styles.place}
        aria-labelledby="address"
      >
        <div className={styles.address}>
          <h2
            id="address"
            className={styles.caps}
          >
            Адрес
          </h2>
          <p className={styles.text}>{typograph(site.address)}</p>
        </div>

        {latitude != null && longitude != null ? (
          <MapEmbed
            point={{ latitude, longitude }}
            label={`Карта: ${site.address}`}
          />
        ) : null}
      </section>

      <CmsSections sections={page?.sections ?? []} />
    </SiteFrame>
  );
};

export default DirectionsPage;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMediaSample } from '@/cms/media';
import { getSite } from '@/cms/site';
import { SiteFrame } from '@/components/SiteFrame';
import { isStand } from '@/lib/stand';
import { getTheme } from '@/lib/theme';
import { SAMPLE_PHOTOS, SECTIONS } from './consts';
import { frameSections } from './frame';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Кауп — витрина компонентов',
  description: 'Служебная страница: компоненты направления в обеих темах.',
};

const ComponentsPage = async () => {
  if (isStand()) {
    notFound();
  }

  const [photos, site, theme] = await Promise.all([getMediaSample(SAMPLE_PHOTOS), getSite(), getTheme()]);

  return (
    <SiteFrame
      site={site}
      theme={theme}
    >
      <div className={styles.page}>
        <p className={styles.caps}>Служебная страница</p>
        <h1 className={styles.title}>Витрина компонентов</h1>
        <p className={styles.lead}>
          Компоненты направления в&nbsp;обеих темах. В&nbsp;страницы демо витрина не&nbsp;входит и&nbsp;на&nbsp;стенде
          закрыта.
        </p>

        {[...frameSections(photos), ...SECTIONS].map((section) => (
          <section
            key={section.id}
            className={styles.section}
          >
            <h2 className={styles.name}>{section.name}</h2>
            <p className={styles.note}>{section.note}</p>

            <div className={styles.view}>{section.view}</div>
          </section>
        ))}
      </div>
    </SiteFrame>
  );
};

export default ComponentsPage;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMediaSample } from '@/cms/media';
import { SvgDefs } from '@/components/SvgDefs';
import { isStand } from '@/lib/stand';
import { SECTIONS } from './consts';
import { frameSections } from './frame';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Кауп — витрина компонентов',
  description: 'Служебная страница: компоненты направления в обеих темах.',
};

/** Кадров витрине хватает шести: просмотр фото листает их по кругу. */
const SAMPLE_PHOTOS = 6;

const ComponentsPage = async () => {
  if (isStand()) {
    notFound();
  }

  const photos = await getMediaSample(SAMPLE_PHOTOS);

  return (
    <main className={styles.page}>
      <SvgDefs />

      <p className={styles.caps}>Служебная страница</p>
      <h1 className={styles.title}>Витрина компонентов</h1>
      <p className={styles.lead}>
        Компоненты направления в&nbsp;обеих темах. В&nbsp;пять страниц демо витрина не&nbsp;входит и&nbsp;на&nbsp;стенде
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
    </main>
  );
};

export default ComponentsPage;

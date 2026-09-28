import type { Photo } from '@/cms/types';
import { PhotoViewer } from '@/components/PhotoViewer';
import { RunicText } from '@/components/RunicText';
import { Section } from '@/components/Section';
import { plural, typograph } from '@/lib/format';
import { mosaicLayout } from '../cards';
import { KICKERS, MOSAIC_SIZES, SHOTS_FORMS } from '../consts';
import styles from './Gallery.module.scss';

export type GalleryProps = {
  anchor: string;
  heading: string;
  photos: Photo[];
};

/**
 * Галерея по артборду v2: мозаика на четырех колонках, до 1279 — на двух, кадр открывается в просмотре. Большие,
 * высокие и широкие клетки раздает `mosaicLayout`, чтобы строки заполнялись при любом числе кадров.
 */
export const Gallery = ({ anchor, heading, photos }: GalleryProps) => {
  const layout = mosaicLayout(photos.length);

  return (
    <Section
      id={anchor}
      labelledBy={`${anchor}-title`}
      className={styles.gallery}
    >
      <div className={styles.head}>
        <div className={styles.heading}>
          <RunicText size="kicker">{KICKERS.gallery}</RunicText>
          <h2
            className={styles.title}
            id={`${anchor}-title`}
          >
            {typograph(heading)}
          </h2>
        </div>
        <p className={styles.count}>
          {photos.length}&nbsp;{plural(photos.length, SHOTS_FORMS)}
        </p>
      </div>

      <PhotoViewer
        label={heading}
        photos={photos}
        className={styles.mosaic}
        itemClassNames={layout.map((size) => (size ? styles[size] : ''))}
        itemSizes={layout.map((size) => MOSAIC_SIZES[size])}
      />
    </Section>
  );
};

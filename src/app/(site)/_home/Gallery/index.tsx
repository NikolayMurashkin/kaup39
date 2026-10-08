import type { Photo } from '@/cms/types';
import { RunicText } from '@/components/RunicText';
import { Section } from '@/components/Section';
import { plural, typograph } from '@/lib/format';
import type { Album } from '@/payload-types';
import { albumTiles, mosaicPlan } from '../cards';
import { KICKERS, SHOTS_FORMS } from '../consts';
import { AlbumTile } from './AlbumTile';
import styles from './Gallery.module.scss';

export type GalleryProps = {
  anchor: string;
  heading: string;
  albums: Album[];
};

/**
 * Галерея по артборду v2: мозаика на четырех колонках, до 1279 — на двух. Плитка — альбом (D43): обложка, название,
 * число кадров; плитка открывает просмотр своего альбома. Большие, высокие и широкие клетки раздает `mosaicPlan`
 * по ориентации обложек, чтобы кадр не резался и строки заполнялись. Альбом без кадров плиткой не выводится.
 */
export const Gallery = ({ anchor, heading, albums }: GalleryProps) => {
  const tiles = albumTiles(albums);
  const plan = mosaicPlan(tiles.map(({ photos }) => photos[0] as Photo));
  const total = tiles.reduce((sum, { photos }) => sum + photos.length, 0);

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
          {total}&nbsp;{plural(total, SHOTS_FORMS)}
        </p>
      </div>

      <ul
        className={styles.mosaic}
        aria-label={heading}
      >
        {plan.map(({ photo, size, sizes }) => {
          const tile = tiles.find(({ photos }) => photos[0] === photo);

          return tile ? (
            <li
              key={tile.slug}
              className={size ? styles[size] : undefined}
            >
              <AlbumTile
                tile={tile}
                sizes={sizes}
              />
            </li>
          ) : null;
        })}
      </ul>
    </Section>
  );
};

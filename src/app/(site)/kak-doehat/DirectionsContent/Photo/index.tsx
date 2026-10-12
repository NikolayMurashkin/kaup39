import Image from 'next/image';
import type { Media } from '@/payload-types';
import { toPhoto } from '@/cms/photo';
import { PhotoNote } from '@/components/PhotoNote';
import { typograph } from '@/lib/format';
import { FIELD_PHOTO_SIZES } from '../../consts';
import styles from './Photo.module.scss';

export type PhotoProps = {
  media: number | Media | null | undefined;
};

/**
 * Кадр раздела в поле: широкая рамка со срезом и подпись. Подпись совпала с `alt` — у картинки пустой `alt`, иначе
 * скринридер прочтет одно и то же дважды. Кадра нет — нет и рамки.
 */
export const Photo = ({ media }: PhotoProps) => {
  const photo = toPhoto(media);

  if (!photo) return null;

  const caption = photo.caption?.trim() || null;

  return (
    <figure className={styles.figure}>
      <div className={styles.media}>
        <Image
          className={styles.image}
          src={photo.src}
          alt={caption === photo.alt.trim() ? '' : photo.alt}
          sizes={FIELD_PHOTO_SIZES}
          fill
        />
        {photo.temporary ? <PhotoNote /> : null}
      </div>
      {caption ? <figcaption className={styles.caption}>{typograph(caption)}</figcaption> : null}
    </figure>
  );
};

import config from '@payload-config';
import { getPayload } from 'payload';
import type { Media } from '@/payload-types';
import type { Photo } from './types';

/** Фотография из медиатеки в том виде, в каком ее рисуют страницы; несвязанная или удаленная — `null`. */
export const toPhoto = (media: number | Media | null | undefined): Photo | null =>
  typeof media === 'object' && media?.url
    ? {
        src: media.url,
        alt: media.alt,
        caption: media.caption ?? null,
        width: media.width ?? null,
        height: media.height ?? null,
        temporary: media.temporary ?? false,
      }
    : null;

/** Первые кадры медиатеки — образцы для витрины компонентов: ей нужны настоящие файлы, оптимизатор берет только их. */
export const getMediaSample = async (limit: number): Promise<Photo[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({ collection: 'media', sort: 'id', limit, depth: 0 });

  return docs.map(toPhoto).filter((photo): photo is Photo => photo !== null);
};

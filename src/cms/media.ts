import config from '@payload-config';
import { getPayload } from 'payload';
import { toPhoto } from './photo';
import type { Photo } from './types';

/** Первые кадры медиатеки — образцы для витрины компонентов: ей нужны настоящие файлы, оптимизатор берет только их. */
export const getMediaSample = async (limit: number): Promise<Photo[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({ collection: 'media', sort: 'id', limit, depth: 0 });

  return docs.map(toPhoto).filter((photo): photo is Photo => photo !== null);
};

import type { Album, Media, Zone } from '@/payload-types';

export type { Album, Media, Zone };

const STAMP = '2026-10-07T00:00:00.000Z';

/** Размер кадра проверочной медиатеки: просмотр не растягивает его больше собственного (D31). */
export const FILE_SIZE = { width: 1600, height: 1000 };

/** Кадр медиатеки: адрес файла по номеру, `author` — только когда задан. */
export const media = (id: number, extra: Partial<Media> = {}): Media => ({
  id,
  alt: `Кадр ${id}`,
  caption: null,
  temporary: false,
  url: `/api/media/file/kadr-${id}.jpg`,
  width: FILE_SIZE.width,
  height: FILE_SIZE.height,
  updatedAt: STAMP,
  createdAt: STAMP,
  ...extra,
});

/** Часть адреса, по которой кадр узнается в `src` оптимизатора. */
export const fileOf = (id: number) => `/api/media/file/kadr-${id}.jpg`;

export const album = (id: number, title: string, photos: Album['photos']): Album => ({
  id,
  title,
  slug: `album-${id}`,
  photos,
  order: id,
  updatedAt: STAMP,
  createdAt: STAMP,
});

export const zone = (id: number, name: string, extra: Partial<Zone> = {}): Zone => ({
  id,
  name,
  slug: `zona-${id}`,
  description: 'Описание проверочной площадки.',
  order: id,
  updatedAt: STAMP,
  createdAt: STAMP,
  ...extra,
});

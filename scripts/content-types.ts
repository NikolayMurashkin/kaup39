import type { PAGE_LABELS } from '../src/cms/consts';
import type { ZoneMark } from '../src/cms/types';

/**
 * Файл контента, который импорт переносит в CMS. Лежит вне git, рядом с выгрузкой исходного сайта
 * (`../research/kaup39/content/content.json`): это тексты владельцев. Фотографии в нем названы именами
 * файлов из `../research/kaup39/media/`, импорт сам загружает их в медиатеку и подставляет ссылки.
 */
export type ContentFile = {
  site: ContentSite;
  media: ContentMedia[];
  events: ContentEvent[];
  zones: ContentZone[];
  taverns: ContentTavern[];
  pages: ContentPage[];
};

export type ContentMedia = { file: string; alt: string; caption?: string };

export type ContentSite = {
  name: string;
  tagline?: string;
  ageNote?: string;
  address: string;
  /** Точка поселения на карте — из ссылки владельцев на Google Карты. */
  map?: { latitude: number; longitude: number };
  phone: string;
  email: string;
  legal?: string;
  socials: { label: string; url: string }[];
  refund: { title: string; body: string; email: string; details: string[] };
};

/** Цены и ссылка на кассу у события не здесь, а в `src/cms/facts.ts`: они в git и сверены с `/tur`. */
export type ContentEvent = {
  slug: string;
  title: string;
  ageRating?: string;
  summary?: string;
  description?: string;
  venue?: string;
  includes?: string[];
  extras?: string[];
  gallery?: string[];
};

export type ContentZone = {
  slug: string;
  name: string;
  mark?: ZoneMark;
  description?: string;
  photo?: string;
  order: number;
};

export type ContentMenuItem = { name: string; note?: string; price: number; priceTo?: number };

export type ContentTavern = {
  slug: string;
  name: string;
  description?: string;
  photo?: string;
  order: number;
  menu?: { title?: string; items: ContentMenuItem[] }[];
};

type SectionBase = { anchor?: string; heading?: string };

export type ContentSection =
  | (SectionBase & { blockType: 'text'; body?: string; photo?: string })
  | (SectionBase & {
      blockType: 'list';
      intro?: string;
      items: { title: string; text?: string; url?: string }[];
      footnote?: string;
    })
  | (SectionBase & {
      blockType: 'prices';
      intro?: string;
      rows: { label: string; amount: number; unit?: string; note?: string }[];
      footnote?: string;
    })
  | (SectionBase & { blockType: 'links'; links: { label: string; url: string }[] })
  | (SectionBase & { blockType: 'photos'; photos: string[] });

export type ContentPage = {
  slug: keyof typeof PAGE_LABELS;
  title: string;
  lead?: string;
  hero?: { photoNight?: string; photoDay?: string };
  sections: ContentSection[];
};

/** Запись манифеста выгрузки фотографий: с каких страниц исходного сайта снят кадр. */
export type MediaManifestEntry = { file: string; url: string; pages: string[]; bytes: number };

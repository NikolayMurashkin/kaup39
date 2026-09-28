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
  /** Кадр карточки события на главной. */
  photo?: string;
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

/** Карточка страницы на главной: заголовок, текст, подпись ссылки и кадр. */
export type ContentTeaser = { title?: string; text?: string; action?: string; photo?: string };

export type ContentPage = {
  slug: keyof typeof PAGE_LABELS;
  title: string;
  lead?: string;
  hero?: { photoNight?: string; photoDay?: string };
  teaser?: ContentTeaser;
  sections: ContentSection[];
};

/**
 * Основание, по которому кадр стоит на сайте (D31): `owners` — контент владельцев из их каналов по их разрешению
 * (D26), `consent` — письменное согласие стороннего автора, `license` — открытая лицензия, `temporary` — временный
 * чужой кадр из интернета без согласия и лицензии: на сайте подписан «фото для примера», владельцы заменяют его
 * в админке.
 */
export type PhotoBasis = 'owners' | 'consent' | 'license' | 'temporary';

/** Строка реестра происхождения: откуда кадр, кто автор, на каком основании он на сайте и что на нем. */
export type PhotoRecord = {
  file: string;
  /**
   * Адрес, откуда взят кадр: страница исходного сайта, пост, альбом, видео, статья. У кадра владельцев — их канал
   * или «архив владельцев…», у временного кадра — адрес страницы, где он найден.
   */
  source: string;
  author: string;
  basis: PhotoBasis;
  /** У стороннего кадра — где лежит согласие автора (письмо, сообщение) или адрес лицензии. */
  basisProof?: string;
  /** Что на кадре и какое это место «Каупа». */
  subject: string;
  /** Кто подтвердил, что на кадре именно это место, а не похожее (D14). */
  confirmedBy?: string;
  /** Слоты артборда v2 (`data-slot`), куда предложен кадр. */
  slots: string[];
};

/**
 * Реестр происхождения фотографий «Каупа» (`../research/kaup39/content/photos.json`, вне git, как и контент).
 * `noPhoto` — слоты артборда, для которых подходящего кадра нет: они получают карточку без фото.
 * `noBetterPhoto` — слоты, где кадр слабее 1,5 пикселя на CSS-пиксель (D31), а кадра лучше нет, с пояснением.
 */
export type PhotoRegistry = {
  photos: PhotoRecord[];
  noPhoto: { slot: string; note: string }[];
  noBetterPhoto: { slot: string; note: string }[];
};

import type { PageSection } from '@/cms/types';

type SectionOf<Type extends PageSection['blockType']> = Extract<PageSection, { blockType: Type }>;

/** Разделы страницы кемпинга, разложенные по якорю и типу блока; `rest` — все прочие в порядке CMS. */
export type CampingParts = {
  description: SectionOf<'text'> | null;
  prices: SectionOf<'prices'> | null;
  services: SectionOf<'list'> | null;
  photos: SectionOf<'photos'> | null;
  booking: SectionOf<'phone'> | null;
  rest: PageSection[];
};

/** Часть страницы, которую рисует код: ее якорь в CMS и тип блока. */
export type CampingPartSpec = {
  anchor: string;
  blockType: PageSection['blockType'];
};

/** Пара строки фактов шапки: что и сумма в рублях, отформатированная `formatAmount`. */
export type CampingFact = {
  label: string;
  amount: string;
};

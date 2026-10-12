import type { PageSection } from '@/cms/types';

type SectionOf<Type extends PageSection['blockType']> = Extract<PageSection, { blockType: Type }>;

/** Разделы страницы «как доехать», разложенные по якорю и типу блока; `rest` — все прочие в порядке CMS. */
export type DirectionsParts = {
  car: SectionOf<'text'> | null;
  maps: SectionOf<'links'> | null;
  bus: SectionOf<'list'> | null;
  transfer: SectionOf<'text'> | null;
  stops: SectionOf<'list'> | null;
  price: SectionOf<'prices'> | null;
  rules: SectionOf<'list'> | null;
  ticket: SectionOf<'links'> | null;
  rest: PageSection[];
};

/** Часть страницы, которую рисует код: ее якорь в CMS и тип блока. */
export type DirectionsPartSpec = {
  anchor: string;
  blockType: PageSection['blockType'];
};

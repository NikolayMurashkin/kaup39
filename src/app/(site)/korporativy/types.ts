import type { PageSection } from '@/cms/types';
import type { Review } from '@/payload-types';

type SectionOf<Type extends PageSection['blockType']> = Extract<PageSection, { blockType: Type }>;

/** Часть страницы, которую рисует код: ее якорь в CMS и тип блока. */
export type CorporatePartSpec = {
  anchor: string;
  blockType: PageSection['blockType'];
};

/** Разделы страницы корпоративов, разложенные по якорю и типу блока; `rest` — все прочие в порядке CMS. */
export type CorporateParts = {
  newYear: SectionOf<'text'> | null;
  capacity: SectionOf<'list'> | null;
  formats: SectionOf<'list'> | null;
  longhouse: SectionOf<'text'> | null;
  fireShow: SectionOf<'list'> | null;
  food: SectionOf<'list'> | null;
  rent: SectionOf<'text'> | null;
  rentPrices: SectionOf<'prices'> | null;
  photos: SectionOf<'photos'> | null;
  request: SectionOf<'text'> | null;
  rest: PageSection[];
};

/** Отзыв гостя так, как его получает страница. */
export type CorporateReview = Review;

/** Цена аренды для шапки и разделов: сумма уже с разрядами и за что она — «час». */
export type RentPrice = {
  label: string;
  amount: string;
  unit: string | null;
};

import { formatAmount } from '@/lib/format';
import type { Page } from '@/payload-types';
import { CORPORATE_PARTS } from './consts';
import type { CorporateParts, RentPrice } from './types';

export type { CorporateParts } from './types';

const PART_KEYS = Object.keys(CORPORATE_PARTS) as (keyof typeof CORPORATE_PARTS)[];

/**
 * Разделы страницы корпоративов по частям: часть занимает первый раздел с ее якорем и типом блока. Раздел с чужим
 * якорем, с известным якорем, но чужим типом, и повтор якоря не пропадают: они идут в `rest` в порядке CMS.
 */
export const corporateParts = (sections: Page['sections']): CorporateParts => {
  const parts: CorporateParts = {
    ...(Object.fromEntries(PART_KEYS.map((key) => [key, null])) as Record<(typeof PART_KEYS)[number], null>),
    rest: [],
  };

  for (const section of sections ?? []) {
    const key = PART_KEYS.find(
      (candidate) =>
        parts[candidate] === null &&
        CORPORATE_PARTS[candidate].anchor === section.anchor &&
        CORPORATE_PARTS[candidate].blockType === section.blockType,
    );

    if (key) Object.assign(parts, { [key]: section });
    else parts.rest.push(section);
  }

  return parts;
};

/** Цены аренды из строк раздела цен: правка суммы в админке меняет и шапку, и разделы страницы. */
export const rentPrices = (prices: CorporateParts['rentPrices']): RentPrice[] =>
  (prices?.rows ?? []).map(({ label, amount, unit }) => ({
    label,
    amount: formatAmount(amount),
    unit: unit?.trim() || null,
  }));

/** За что цена: «в час». Единицы нет — `null`. */
export const rentUnit = ({ unit }: RentPrice) => (unit ? `в ${unit}` : null);

/** Подпись строки цен после «в час»: со строчной, если это не аббревиатура («VIP-зал» остается как есть). */
const midSentence = (label: string) => (/^\p{Lu}\p{Ll}/u.test(label) ? label[0].toLowerCase() + label.slice(1) : label);

/** Подпись цены аренды в ряду цифр и в разделе цен: «в час, аренда поселения». */
export const rentNote = (price: RentPrice) =>
  [rentUnit(price), price.label && midSentence(price.label)].filter(Boolean).join(', ');

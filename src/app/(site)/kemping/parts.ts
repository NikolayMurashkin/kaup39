import { formatAmount } from '@/lib/format';
import type { Page } from '@/payload-types';
import { CAMPING_PARTS, FACTS_ROWS } from './consts';
import type { CampingFact, CampingParts } from './types';

export type { CampingParts } from './types';

const PART_KEYS = Object.keys(CAMPING_PARTS) as (keyof typeof CAMPING_PARTS)[];

/**
 * Разделы страницы кемпинга по частям: часть занимает первый раздел с ее якорем и типом блока. Раздел с чужим
 * якорем, с известным якорем, но чужим типом, и повтор якоря не пропадают: они идут в `rest` в порядке CMS.
 */
export const campingParts = (sections: Page['sections']): CampingParts => {
  const parts: CampingParts = {
    ...(Object.fromEntries(PART_KEYS.map((key) => [key, null])) as Record<(typeof PART_KEYS)[number], null>),
    rest: [],
  };

  for (const section of sections ?? []) {
    const key = PART_KEYS.find(
      (candidate) =>
        parts[candidate] === null &&
        CAMPING_PARTS[candidate].anchor === section.anchor &&
        CAMPING_PARTS[candidate].blockType === section.blockType,
    );

    if (key) Object.assign(parts, { [key]: section });
    else parts.rest.push(section);
  }

  return parts;
};

/** Пары строки фактов шапки — первые строки цен: что и сумма, уже с разрядами. Шапка рисует их со знаком рубля. */
export const campingFactRows = (prices: CampingParts['prices']): CampingFact[] =>
  (prices?.rows ?? []).slice(0, FACTS_ROWS).map(({ label, amount }) => ({ label, amount: formatAmount(amount) }));

/** Строка фактов шапки текстом: «До 5 человек — 2000 ₽, 1 человек — 800 ₽». Цен нет — `null`. */
export const campingFacts = (prices: CampingParts['prices']): string | null => {
  const rows = campingFactRows(prices);

  return rows.length ? rows.map(({ label, amount }) => `${label} — ${amount} ₽`).join(', ') : null;
};

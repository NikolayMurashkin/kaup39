import { DIRECTIONS_ANCHORS } from '@/cms/consts';
import type { PageSection } from '@/cms/types';
import type { Page } from '@/payload-types';
import { paragraphs, typograph } from '@/lib/format';
import type { TransferSummary } from './TravelTiles/types';

const byAnchor = (page: Page | null, anchor: string): PageSection | undefined =>
  page?.sections?.find((section) => section.anchor === anchor);

/** Плашка трансфера из разделов страницы «как доехать»: заголовок и первый абзац текста, цена первой строки. */
export const transferOf = (directions: Page | null): TransferSummary | null => {
  const text = byAnchor(directions, DIRECTIONS_ANCHORS.transfer);
  const prices = byAnchor(directions, DIRECTIONS_ANCHORS.transferPrice);

  if (text?.blockType !== 'text' || !text.heading) return null;

  const row = prices?.blockType === 'prices' ? prices.rows?.[0] : undefined;

  return {
    anchor: DIRECTIONS_ANCHORS.transfer,
    heading: text.heading,
    text: paragraphs(text.body)[0] ?? null,
    amount: row?.amount ?? null,
    priceNote: prices?.blockType === 'prices' && prices.heading ? typograph(prices.heading) : null,
  };
};

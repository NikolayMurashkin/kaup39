import type { ZoneMark } from '@/cms/types';

/** Идентификаторы орнаментов и текстур: на них ссылаются `fill` и `filter` компонентов. */
export const RING_CHAIN_ID = 'ring-chain';

export const RING_CHAIN_V_ID = 'ring-chain-v';

export const WOOD_GRAIN_ID = 'wood-grain';

export const IRON_GRAIN_ID = 'iron-grain';

/** Знаки площадок: символ `mark-<знак>` в спрайте. */
export const MARK_ID_PREFIX = 'mark-';

/** Контуры знаков в сетке 24 × 24 — из артборда. */
export const MARK_PATHS: Record<ZoneMark, string> = {
  house: 'M3 13l9-8 9 8M6 12v8h12v-8M9 6l3-3 3 3',
  forge: 'M4 21h13l-2-4H6zM5 17v-4h8l4 3h3M9 13V9M4 5h9l-2 4H6z',
  pot: 'M6 9h12M8 9c-1 4-1 8 1 11h6c2-3 2-7 1-11M9 9V6h6v3',
  bow: 'M7 3c6 5 6 13 0 18M4 12h16M15 8l5 4-5 4',
  shield: 'M12 3l8 3v7c0 5-4 7-8 8-4-1-8-3-8-8V6zM12 3v18M4 12h16',
  ship: 'M2 14c3 5 7 7 12 7s8-2 8-7zM11 14V5M11 6h7v5h-7M20 14V9c0-3-2-5-5-5',
  hall: 'M5 21V9M19 21V9M3 9h18M8 21v-7h8v7M12 3v4',
  horn: 'M3 7c7-2 14 1 18 8-4 4-9 5-13 2S4 10 3 7zM3 7l3 2',
};

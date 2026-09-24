import type { TariffKind } from '@/cms/types';

/** Подпись под ценой: какой билет стоит столько. */
export const TARIFF_NOTES: Record<TariffKind, string> = {
  entry: 'входной билет',
  adult: 'взрослый билет',
  child: 'детский билет',
  family22: 'семейный, 2 + 2',
  family21: 'семейный, 2 + 1',
};

/** Сколько ближайших дат стоит в ленте под первым экраном. */
export const STRIP_LIMIT = 5;

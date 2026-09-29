/** Кадр первого экрана во всю ширину окна, но не шире рамки главной — 1920 px. */
export const HERO_SIZES = '(max-width: 1920px) 100vw, 1920px';

/** Телефонная колонка — до 640 px включительно, как медиазапрос направления. */
export const HERO_NARROW_MEDIA = '(max-width: 640px)';

/** Все, что шире телефонной колонки: только для предзагрузки, в верстке это источник `<img>` по умолчанию. */
export const HERO_WIDE_MEDIA = 'not all and (max-width: 640px)';

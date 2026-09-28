/** Ширина окна просмотра на широком экране; на телефоне окно во всю ширину. */
export const VIEWER_WIDTH = 1180;

/** Размер на случай, когда медиатека не знает размера файла: next/image без него кадр не нарисует. */
export const VIEWER_FALLBACK_SIZE = { width: 1600, height: 1000 };

/** Клетка галереи: половина ширины на телефоне, треть — шире. */
export const SHOT_SIZES = '(max-width: 640px) 50vw, 33vw';

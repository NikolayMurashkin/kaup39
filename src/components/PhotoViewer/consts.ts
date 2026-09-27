/** Какую ширину кадр занимает в просмотре: окно не шире 1180 px, на телефоне — вся ширина. */
export const VIEWER_SIZES = '(max-width: 1180px) 100vw, 1180px';

/** Размер на случай, когда медиатека не знает размера файла: next/image без него кадр не нарисует. */
export const VIEWER_FALLBACK_SIZE = { width: 1600, height: 1000 };

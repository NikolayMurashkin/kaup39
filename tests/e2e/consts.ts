export const PORT = 3200;

export const BASE_URL = `http://127.0.0.1:${PORT}`;

export const THEME_COOKIE = 'theme';

export const THEMES = ['dark', 'light'] as const;

/** Обе ширины артборда: 1440 — широкая доска, 390 — узкая. */
export const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
] as const;

/** Порог WCAG 2.1 для обычного текста. */
export const MIN_RATIO = 4.5;

/**
 * Сглаживание по краю буквы дает промежуточные цвета, поэтому одиночные пиксели ниже порога
 * не значат, что текст нечитаем. Допуск задан в пикселях на строку, а не долей узла: доля от
 * узла на длинном тексте прячет под допуском целое слово (ошибка, оплаченная блоком B50).
 */
export const TOLERANCE_PER_LINE = 2;

/** Ниже этого числа текстовых узлов проверка нечего сторожить — значит, страница не отрисовалась. */
export const MIN_TEXT_NODES = 8;

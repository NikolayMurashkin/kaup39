export { MIN_RATIO } from '../lib/contrast';
export { THEME_COOKIE, THEMES } from '../../src/lib/consts';

export const PORT = 3200;

export const BASE_URL = `http://127.0.0.1:${PORT}`;

/** Обе ширины артборда: 1440 — широкая доска, 390 — узкая. */
export const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
] as const;

/**
 * Сглаживание по краю буквы дает промежуточные цвета, поэтому одиночные пиксели ниже порога
 * не значат, что текст нечитаем. Допуск задан в пикселях на строку, а не долей узла: доля от
 * узла на длинном тексте прячет под допуском целое слово.
 */
export const TOLERANCE_PER_LINE = 2;

/** Ниже этого числа текстовых узлов проверка нечего сторожить — значит, страница не отрисовалась. */
export const MIN_TEXT_NODES = 8;

/** Кадры съемки: обычный, с погашенным текстом и со спрятанными руническими надписями. */
export const MASK = {
  none: '',
  text: 'body, body * { color: transparent !important; }',
  runes: 'svg[data-runic] { visibility: hidden !important; }',
};

/** Разница цвета между обычным кадром и кадром с погашенным текстом, после которой пиксель считается закрашенным. */
export const PAINTED_DIFF = 90;

/** Меньше этой площади узел не меряется: одна-две точки не дают устойчивого результата. */
export const MIN_AREA = 10;

export { MIN_RATIO } from '../lib/contrast';
export { NARROW_BREAKPOINT, TEXT_FONT_TOKENS } from '../lib/consts';
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

/** Служебная витрина компонентов направления: в пять страниц демо не входит. */
export const SHOWCASE_PATH = '/components';

/**
 * Сколько цен стоит на витрине: четыре отдельных образца, две в карточках событий и одна
 * в панели ближайшего. Число закреплено, а не взято с запасом: убрать образец с витрины —
 * значит снять проверку с целого компонента, и это должно быть видно по упавшему тесту.
 */
export const MIN_PRICES = 7;

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

/** На сколько задерживается ответ каждого `.woff2`, чтобы страница успела нарисоваться запасными начертаниями. */
export const FONT_DELAY = 1500;

/**
 * Насколько ширина и высота над и под базовой линией у текста страницы, набранного метрическим
 * запасным начертанием, могут отличаться от того же текста настоящим шрифтом. Подогнанные по кириллице
 * метрики дают до 1%, числа next/font — от 2,2% (Golos Text, на `/` запас всего 0,2 пункта) до 16%
 * (Forum), `size-adjust: 100%` — от 5% до 15%.
 */
export const MAX_FALLBACK_DEVIATION = 0.02;

/** Порог CLS из критерия шрифтов: столько же держит Lighthouse CI на каждом прогоне. */
export const MAX_FONT_SWAP_SHIFT = 0.02;

/**
 * Имя шрифта, которое сообщает Chrome: `getPlatformFontsForNode` берет его из таблицы `name` файла,
 * а не из CSS. У Forum они расходятся: его OFL резервирует имя «Forum», и сабсет как модифицированная
 * версия переименован внутри файла (`scripts/subset-fonts.mts`), а в CSS семейство по-прежнему 'Forum'.
 */
export const FILE_FAMILY: Record<string, string> = {
  Ponomar: 'Ponomar',
  Forum: 'Kaup Caps',
  'Golos Text': 'Golos Text',
};

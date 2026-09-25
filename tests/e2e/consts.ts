import { SCHEDULE_PATH } from '../../src/lib/consts';

export { MIN_RATIO } from '../lib/contrast';
export { NARROW_BREAKPOINT, TEXT_FONT_TOKENS } from '../lib/consts';
export { SCHEDULE_PATH, THEME_COOKIE, THEMES } from '../../src/lib/consts';

export const PORT = 3200;

export const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * База e2e-сервера: своя, с проверочным контентом из `tests/e2e/seed/`. На CI адрес приходит из сервиса
 * Postgres, локально это тот же контейнер, что и у рабочей базы.
 */
export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgres://kaup39:kaup39@127.0.0.1:5433/kaup39_e2e';

/** Медиатека e2e-сервера: проверочные кадры не мешаются с фотографиями владельцев в `media/`. */
export const E2E_MEDIA_DIR = 'media-e2e';

/** Тесты, которые меняют e2e-базу: они идут отдельным проектом после всех остальных. */
export const STATE_SPECS = /\.state\.spec\.ts$/;

/**
 * Сколько видимых текстовых узлов главной несут длинное слово засева. Число закреплено: проверка
 * переносов не должна проходить потому, что длинный текст пропал со страницы.
 */
export const MIN_LONG_TEXT_NODES = 31;

/**
 * Сколько текстовых узлов меряет замер контраста на страницах засева, по ширинам: на узкой прячутся
 * меню шапки и подпись вордмарка. Порог закреплен по факту: пропуск неотрисованного текста не должен
 * молча снять с замера целый раздел.
 */
export const MIN_PAGE_TEXT_NODES: Record<string, Record<string, number>> = {
  '/': { '1440': 154, '390': 149 },
  [SCHEDULE_PATH]: { '1440': 97, '390': 92 },
};

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
 * Насколько ширина и высота над и под базовой линией у текста, набранного метрическим запасным
 * начертанием, могут отличаться от того же текста настоящим шрифтом. Подогнанные метрики укладывают
 * эталонные тексты в 1,5%, страницы засева — в 1,9% на маке и 1,6% на Linux; числа next/font у Golos Text
 * дают 2,1% на `/` засева и 2,5% на тексте артборда, у Forum — до 16%, `size-adjust: 100%` — от 5% до 15%.
 */
export const MAX_FALLBACK_DEVIATION = 0.02;

/**
 * Кегль, на котором меряются запасные начертания. На Linux Chrome округляет ширину глифов до пикселя:
 * на 100px это давало до 1% расхождения с маком на одном и том же шрифте, хотя Liberation и Times New Roman
 * метрически равны, а на 1000px они совпадают до третьего знака. Тем же кеглем метрики считает
 * `scripts/fallback-metrics.mts`.
 */
export const FONT_MEASURE_SIZE = 1000;

/**
 * Сверки на эталонных текстах: у каждой гарнитуры текст артборда, все даты и текст из одних цифр — суммы
 * засева у тех, что набирают суммы на страницах, и числа месяца у Forum. Список закреплен: пропавшая сверка должна ронять тест, а не молча уменьшать его.
 */
export const REFERENCE_CHECKS = [
  'Ponomar: artboard',
  'Ponomar: dates',
  'Ponomar: prices',
  'Forum: artboard',
  'Forum: dates',
  'Forum: numbers',
  'Golos Text: artboard',
  'Golos Text: dates',
  'Golos Text: prices',
];

/**
 * Части строки расписания, текст которых сверяется с запасным начертанием в DOM. Дата сюда не входит: даты засева
 * сдвигаются каждый день, и они меряются всеми днями года в стиле узла даты. У строки засева с длинным словом
 * событие не меряется — это нагрузка для теста переносов, а не текст.
 */
export const ROW_PARTS = ['time', 'event', 'price', 'ticket'];

/** Свойства текста, от которых зависят ширина строки и ее высота: копия узла получает их явно, а не каскадом. */
export const ROW_TEXT_STYLE = [
  'font-size',
  'font-weight',
  'font-style',
  'font-stretch',
  'font-kerning',
  'font-optical-sizing',
  'font-size-adjust',
  'font-synthesis',
  'font-variant-caps',
  'font-variant-east-asian',
  'font-variant-ligatures',
  'font-variant-numeric',
  'font-variant-position',
  'font-feature-settings',
  'font-variation-settings',
  'letter-spacing',
  'word-spacing',
  'text-transform',
  'text-rendering',
];

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

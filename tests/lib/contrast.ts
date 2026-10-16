export type Rgb = [number, number, number];

export type Color = { rgb: Rgb; alpha: number };

export const MIN_RATIO = 4.5;

const parseHexColor = (value: string): Color | null => {
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value);

  if (!hex) {
    return null;
  }

  const raw = hex[1].length <= 4 ? [...hex[1]].map((channel) => channel + channel).join('') : hex[1];
  const channels = [0, 2, 4, 6].slice(0, raw.length / 2).map((index) => parseInt(raw.slice(index, index + 2), 16));

  return { rgb: channels.slice(0, 3) as Rgb, alpha: channels.length === 4 ? channels[3] / 255 : 1 };
};

const NUMBER = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?`;

const channelOf = (raw: string) => (raw.endsWith('%') ? (parseFloat(raw) / 100) * 255 : parseFloat(raw));

const alphaOf = (raw: string) => (raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw));

/** `rgb()` и `rgba()`: каналы через запятые или пробелы, альфа числом или процентом. */
const parseRgbColor = (value: string): Color | null => {
  const part = `(${NUMBER}%?)`;
  const legacy = new RegExp(String.raw`^rgba?\(\s*${part}\s*,\s*${part}\s*,\s*${part}\s*(?:,\s*${part}\s*)?\)$`, 'i');
  const modern = new RegExp(String.raw`^rgba?\(\s*${part}\s+${part}\s+${part}\s*(?:/\s*${part}\s*)?\)$`, 'i');
  const match = legacy.exec(value) ?? modern.exec(value);

  if (!match) {
    return null;
  }

  const [, r, g, b, a] = match;
  const rgb = [r, g, b].map(channelOf) as Rgb;
  const alpha = a === undefined ? 1 : alphaOf(a);

  if (rgb.some((channel) => channel < 0 || channel > 255) || alpha < 0 || alpha > 1) {
    return null;
  }

  return { rgb, alpha };
};

/** Цвет, который тест умеет посчитать: hex (3/4/6/8 знаков), `rgb()`, `rgba()`. Остальное — `null`. */
export const parseColor = (value: string): Color | null => {
  const trimmed = value.trim();

  return parseHexColor(trimmed) ?? parseRgbColor(trimmed);
};

/** Функции цвета CSS: значение с ними — цвет, даже если тест не умеет его посчитать. */
const COLOR_FUNCTION = /^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(/i;

/** Значение токена — цвет: hex или функция цвета CSS. Градиент, `var()`, число и прочее — не цвет. */
export const isColorValue = (value: string) => {
  const trimmed = value.trim();

  return /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed) || COLOR_FUNCTION.test(trimmed);
};

/** Цветовые токены текста и фона, которых нет ни в одной паре. */
export const uncoveredColorTokens = (tokens: Record<string, string>, pairs: { text: string; bg: string }[]) =>
  Object.keys(tokens).filter(
    (token) =>
      (token.startsWith('--text-') || token.startsWith('--bg-')) &&
      isColorValue(tokens[token]) &&
      !pairs.some((pair) => pair.text === token || pair.bg === token),
  );

/** Полупрозрачный цвет поверх непрозрачного: что видит глаз. */
export const composite = ({ rgb, alpha }: Color, backdrop: Rgb): Rgb =>
  rgb.map((channel, index) => channel * alpha + backdrop[index] * (1 - alpha)) as Rgb;

const luminance = ([r, g, b]: Rgb) => {
  const channel = (value: number) => {
    const part = value / 255;

    return part <= 0.03928 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const contrast = (foreground: Rgb, background: Rgb) => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((first, second) => second - first);

  return (lighter + 0.05) / (darker + 0.05);
};

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const SVG_PATH = fileURLToPath(new URL('../../public/map/settlement.svg', import.meta.url));

/** Рисунок владельцев 1680 × 1047: x и y точек — проценты от него, другая пропорция сдвинула бы точки. */
const DRAWING_RATIO = 1680 / 1047;

/** Предел веса рисунка в gzip. */
const MAX_GZIP_BYTES = 150 * 1024;

/** Свойства, которые задают цвет: в атрибуте, в `style` и в `<style>` внутри SVG. */
const COLOR_PROPERTIES = ['fill', 'stroke', 'color', 'stop-color', 'flood-color', 'lighting-color'];

/** Именованные цвета CSS: в рисунке на токенах их быть не должно, как и hex и цветовых функций. */
const NAMED_COLORS = new Set(
  (
    'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood ' +
    'cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray ' +
    'darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen ' +
    'darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue ' +
    'firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew ' +
    'hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan ' +
    'lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray ' +
    'lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue ' +
    'mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred ' +
    'midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid ' +
    'palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple ' +
    'rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue ' +
    'slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white ' +
    'whitesmoke yellow yellowgreen'
  ).split(' '),
);

const HEX = /#[0-9a-f]{3,8}(?![0-9a-z_-])/i;

const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;

/** Значение без ссылок `url(#id)`: `#id` в них — адрес градиента или маски, а не цвет. */
const withoutUrls = (value: string) => value.replace(/url\([^)]*\)/gi, '');

/** Литерал цвета в значении свойства: hex, цветовая функция или имя цвета вне `var(--…)`. */
const isColorLiteral = (value: string) => {
  const bare = withoutUrls(value);
  const words = bare.toLowerCase().match(/-{0,2}[a-z][a-z0-9-]*/g) ?? [];

  return HEX.test(bare) || COLOR_FUNCTION.test(bare) || words.some((word) => NAMED_COLORS.has(word));
};

/** Объявления `свойство: значение` из CSS — атрибута `style` или элемента `<style>`. */
const declarationsOf = (css: string) =>
  [...css.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)/gi)].map(({ 1: name, 2: value }) => ({
    name: name.toLowerCase(),
    value: value.trim(),
  }));

/** Все литералы цвета SVG: в цветовых атрибутах, в `style` и в `<style>`. */
const colorLiterals = (svg: string) => {
  const attributes = [...svg.matchAll(/\s([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)].map(
    ({ 1: name, 2: double, 3: single }) => ({ name: name.toLowerCase(), value: double ?? single ?? '' }),
  );
  const styles = [...svg.matchAll(/<style\b[^>]*>(.*?)<\/style>/gis)].map(({ 1: css }) =>
    css.replace(/<!\[CDATA\[|\]\]>/g, ''),
  );
  const css = [
    ...attributes.filter(({ name }) => name === 'style').flatMap(({ value }) => declarationsOf(value)),
    ...styles.flatMap(declarationsOf),
  ];

  return [
    ...attributes
      .filter(({ name, value }) => COLOR_PROPERTIES.includes(name) && isColorLiteral(value))
      .map(({ name, value }) => `${name}="${value}"`),
    ...css
      .filter(({ name, value }) => COLOR_PROPERTIES.includes(name) && isColorLiteral(value))
      .map(({ name, value }) => `${name}: ${value}`),
    ...styles.filter((style) => HEX.test(withoutUrls(style)) || COLOR_FUNCTION.test(style)).map(() => '<style>'),
  ];
};

const svgWith = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${inner}</svg>`;

const readSvg = () => readFileSync(SVG_PATH, 'utf8');

describe('рисунок карты поселения', () => {
  it.each([
    '<path fill="#000" d="M0 0h1"/>',
    '<path stroke="#a1b2c3" d="M0 0h1"/>',
    '<path stroke="rgb(0, 0, 0)" d="M0 0h1"/>',
    '<path fill="rgba(0, 0, 0, 0.5)" d="M0 0h1"/>',
    '<path fill="hsl(30 40% 50%)" d="M0 0h1"/>',
    '<path fill="black" d="M0 0h1"/>',
    '<path style="fill:red" d="M0 0h1"/>',
    '<linearGradient id="g"><stop offset="0" stop-color="white"/></linearGradient>',
    '<style>.line { stroke: #123456; }</style><path class="line" d="M0 0h1"/>',
  ])('детектор ловит литерал цвета: %s', (inner) => {
    expect(colorLiterals(svgWith(inner))).not.toEqual([]);
  });

  it.each([
    '<path fill="currentColor" d="M0 0h1"/>',
    '<path stroke="var(--line-strong)" d="M0 0h1"/>',
    '<path fill="none" stroke="currentColor" d="M0 0h1"/>',
    '<path fill="inherit" d="M0 0h1"/>',
    '<path fill="url(#abc)" d="M0 0h1"/>',
  ])('детектор пропускает цвет темы и пустую заливку: %s', (inner) => {
    expect(colorLiterals(svgWith(inner))).toEqual([]);
  });

  it('в файле рисунка нет литералов цвета — только currentColor и переменные токенов', () => {
    expect(existsSync(SVG_PATH)).toBe(true);
    expect(colorLiterals(readSvg())).toEqual([]);
  });

  it('файл рисунка в gzip не больше 150 КБ', () => {
    expect(existsSync(SVG_PATH)).toBe(true);
    expect(gzipSync(readFileSync(SVG_PATH)).length).toBeLessThanOrEqual(MAX_GZIP_BYTES);
  });

  it('viewBox рисунка — пропорция рисунка владельцев 1680 : 1047 (±0,5 %)', () => {
    expect(existsSync(SVG_PATH)).toBe(true);

    const root = readSvg().match(/<svg\b[^>]*>/i)?.[0] ?? '';
    const box = (root.match(/\sviewBox\s*=\s*["']([^"']*)["']/)?.[1] ?? '')
      .trim()
      .split(/[\s,]+/)
      .map(Number);

    expect(box).toHaveLength(4);

    const [, , width, height] = box;

    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    expect(Math.abs(width / height / DRAWING_RATIO - 1)).toBeLessThanOrEqual(0.005);
  });
});

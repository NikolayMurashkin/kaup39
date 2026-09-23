import { describe, expect, it } from 'vitest';
import { scssGroups } from '../lib/artboard';
import { TEXT_FONT_TOKENS } from '../lib/consts';
import { familiesOf, localsOf, readTokenFontFaces, usedFontTokens } from '../lib/fonts';

/**
 * Локальные шрифты, на которые опирается запасное начертание. Своего fallback у next/font хватает
 * только маку и Windows: он ссылается на `local(Arial)`, а на Linux (раннер Lighthouse) и Android
 * такого шрифта нет — там текст до загрузки был бы другой ширины и прыгал.
 */
const LOCAL_FALLBACKS = {
  serif: ['Times New Roman', 'Liberation Serif', 'Noto Serif'],
  'sans-serif': ['Arial', 'Liberation Sans', 'Roboto'],
} as const;

const METRICS = ['ascent-override', 'descent-override', 'line-gap-override', 'size-adjust'];

const tokens = scssGroups().dark;

const faces = readTokenFontFaces();

describe('шрифты направления в токенах', () => {
  it('текст набирают ровно три токена шрифта, руническим надписям шрифт не нужен', () => {
    expect(usedFontTokens()).toEqual([...TEXT_FONT_TOKENS]);
  });

  it.each(TEXT_FONT_TOKENS)('%s: вторым в цепочке стоит метрическое запасное начертание первого семейства', (token) => {
    const [family, fallback] = familiesOf(tokens[token] ?? '');

    expect(fallback).toBe(`${family} Metric Fallback`);
  });

  it.each(TEXT_FONT_TOKENS)('%s: запасное начертание объявлено с метриками и шрифтами Linux и Android', (token) => {
    const families = familiesOf(tokens[token] ?? '');
    const generic = families.at(-1) as keyof typeof LOCAL_FALLBACKS;
    const face = faces.find(({ family }) => family === families[1]);

    expect(face, `нет @font-face для ${families[1]}`).toBeDefined();
    expect(localsOf(face?.descriptors.src ?? '')).toEqual(LOCAL_FALLBACKS[generic]);

    for (const metric of METRICS) {
      expect(face?.descriptors[metric], metric).toMatch(/^\d+(\.\d+)?%$/);
    }
  });
});

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import snapshot from '../fixtures/artboard-text.json' with { type: 'json' };
import { artboardIsReachable, ARTBOARD_PATH, scssGroups } from '../lib/artboard';
import { TEXT_FONT_TOKENS } from '../lib/consts';
import { DIGITS_RANGE, GLYPH_FACES } from '../lib/fallback-texts';
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

/** Сколько знаков текста артборда у каждой гарнитуры: снимок, снятый с урезанной страницы, меньше. */
const ARTBOARD_TEXT_LENGTH = { Ponomar: 912, Forum: 1508, 'Golos Text': 2931 };

const percentOf = (value: string | undefined) => Number.parseFloat(value ?? '') / 100;

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

  it.each(TEXT_FONT_TOKENS)(
    '%s: у запасного начертания отдельные начертания цифр и знаков из GLYPH_FACES с теми же шрифтами и той же высотой строки',
    (token) => {
      const [family, fallback] = familiesOf(tokens[token] ?? '');
      const own = faces.filter((face) => face.family === fallback);
      const rest = own.find(({ descriptors }) => !descriptors['unicode-range']);
      const ranges = [DIGITS_RANGE, ...(GLYPH_FACES[family] ?? []).map(({ range }) => range)];

      expect(own).toHaveLength(ranges.length + 1);
      expect(rest, 'начертание без unicode-range').toBeDefined();

      for (const range of ranges) {
        const face = own.find(({ descriptors }) => descriptors['unicode-range'] === range);

        expect(face, `начертание с unicode-range: ${range}`).toBeDefined();
        expect(face?.descriptors.src).toBe(rest?.descriptors.src);

        // override задается долей кегля и масштабируется вместе с size-adjust: высота строки одна, если произведения равны
        for (const metric of ['ascent-override', 'descent-override']) {
          const height = (item: typeof rest) =>
            percentOf(item?.descriptors[metric]) * percentOf(item?.descriptors['size-adjust']);

          expect(height(face), `${range}, ${metric}`).toBeCloseTo(height(rest), 3);
        }

        expect(face?.descriptors['line-gap-override']).toBe('0%');
      }
    },
  );
});

describe('текст артборда для сверки запасных начертаний', () => {
  it('снимок не усечен: у каждой гарнитуры столько знаков, сколько на артборде', () => {
    expect(Object.fromEntries(Object.entries(snapshot.texts).map(([family, text]) => [family, text.length]))).toEqual(
      ARTBOARD_TEXT_LENGTH,
    );
  });

  it('снимок снят с нынешнего артборда (на CI артборда нет — сверка идет на маке)', () => {
    if (!artboardIsReachable()) {
      expect(snapshot.sha256).toMatch(/^[0-9a-f]{64}$/);

      return;
    }

    expect(createHash('sha256').update(readFileSync(ARTBOARD_PATH)).digest('hex')).toBe(snapshot.sha256);
  });
});

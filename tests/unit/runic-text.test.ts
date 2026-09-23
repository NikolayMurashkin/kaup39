import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RunicText } from '@/components/RunicText';
import { CAP_HEIGHT, LETTERS, LETTER_SPACING, SPACE_WIDTH } from '@/components/RunicText/alphabet';
import { runicPath } from '@/components/RunicText/path';
import { readAlphabet, type RunicSnapshot } from '../../scripts/sync-runic-alphabet.mts';
import snapshot from '../fixtures/runic-alphabet.json';

const alphabet = snapshot as unknown as RunicSnapshot;

const SOURCE_PATH = fileURLToPath(new URL('../../../design/kaup/runic-alphabet.mjs', import.meta.url));

const letters = Object.entries(alphabet.letters);

/** Команды кривых в пути SVG: в резьбе по дереву их нет, только отрезки. */
const CURVE_COMMANDS = /[csqtaCSQTA]/;

const segmentsOf = (lines: [number, number][][]) =>
  lines.flatMap((line) => line.slice(1).map((point, index) => [line[index], point] as const));

describe('рунический алфавит', () => {
  it('перенесен целиком: столько же знаков и те же метрики', () => {
    expect(Object.keys(LETTERS)).toEqual(Object.keys(alphabet.letters));
    expect({ CAP_HEIGHT, LETTER_SPACING, SPACE_WIDTH }).toEqual({
      CAP_HEIGHT: alphabet.capHeight,
      LETTER_SPACING: alphabet.letterSpacing,
      SPACE_WIDTH: alphabet.spaceWidth,
    });
  });

  it.each(letters)('%s нарисован теми же отрезками, что в источнике', (char, letter) => {
    expect(LETTERS[char]).toEqual(letter);
  });

  it.each(letters)('%s не содержит ни одной горизонтали', (char) => {
    const horizontal = segmentsOf(LETTERS[char].lines).filter(([from, to]) => from[1] === to[1]);

    expect(horizontal).toEqual([]);
  });

  it.each(letters)('%s набран только отрезками, без кривых', (char) => {
    const { d } = runicPath(char);

    expect(d).not.toMatch(CURVE_COMMANDS);
    expect(d).toMatch(/^M/);
  });

  it('снимок не усечен: столько же знаков и отрезков, сколько в источнике', () => {
    const segments = Object.values(LETTERS).reduce((count, letter) => count + segmentsOf(letter.lines).length, 0);

    expect(Object.keys(alphabet.letters)).toHaveLength(34);
    expect(segments).toBe(141);
  });

  it('снимок алфавита совпадает с источником (на CI источника нет — сверка идет на маке)', async () => {
    if (!existsSync(SOURCE_PATH)) {
      expect(alphabet.sha256).toMatch(/^[0-9a-f]{64}$/);

      return;
    }

    expect(await readAlphabet(SOURCE_PATH)).toEqual(alphabet);
  });
});

describe('RunicText', () => {
  const markup = renderToStaticMarkup(RunicText({ children: 'Кауп' }));

  /** Разметка без единого svg: то, что осталось, — это настоящий текст документа. */
  const withoutSvg = markup.replace(/<svg[\s\S]*?<\/svg>/g, '');

  it('рисует надпись отрезками рун, а не кривыми', () => {
    const paths = [...markup.matchAll(/ d="([^"]+)"/g)].map(([, value]) => value);

    expect(paths.length).toBeGreaterThan(0);
    expect(paths.every((value) => !CURVE_COMMANDS.test(value))).toBe(true);
  });

  it('исходная строка остается в документе текстом, а не подписью к картинке', () => {
    expect(withoutSvg).toContain('Кауп');
    expect(markup).not.toContain('<title>');
    expect(markup).not.toContain('aria-label');
  });

  it('неизвестные знаки не роняют отрисовку', () => {
    expect(() => renderToStaticMarkup(RunicText({ children: 'Кауп 2026 · ёж' }))).not.toThrow();
  });
});

import { describe, expect, it } from 'vitest';
import { THEMES } from '@/lib/consts';
import { artboard, resolvedTokens, scssGroups } from '../lib/artboard';
import { composite, contrast, MIN_RATIO, parseColor, uncoveredColorTokens, type Rgb } from '../lib/contrast';

const groups = scssGroups();

const pairsPerTheme = THEMES.flatMap((theme) =>
  artboard.pairs.map((pair) => ({ theme, pair: `${pair.text} on ${pair.bg}`, ...pair })),
);

/** Самый темный и самый светлый кадр под полупрозрачной плашкой. */
const BACKDROPS: Rgb[] = [
  [0, 0, 0],
  [255, 255, 255],
];

describe('контраст пар «текст на фоне» по токенам', () => {
  it.each(pairsPerTheme)('$theme: $pair не ниже 4,5:1', ({ theme, text, bg }) => {
    const tokens = resolvedTokens(groups, theme);
    const foreground = parseColor(tokens[text] ?? '');
    const background = parseColor(tokens[bg] ?? '');

    expect(foreground, `${text} в теме ${theme} не разобран: ${tokens[text] ?? 'токена нет'}`).not.toBeNull();
    expect(background, `${bg} в теме ${theme} не разобран: ${tokens[bg] ?? 'токена нет'}`).not.toBeNull();

    // полупрозрачный фон считается поверх самого темного и самого светлого кадра, непрозрачный — как есть
    const backgrounds =
      background!.alpha < 1 ? BACKDROPS.map((backdrop) => composite(background!, backdrop)) : [background!.rgb];

    for (const seen of backgrounds) {
      expect(
        contrast(composite(foreground!, seen), seen),
        `${text} на ${bg} поверх rgb(${seen.map(Math.round).join(', ')})`,
      ).toBeGreaterThanOrEqual(MIN_RATIO);
    }
  });

  it.each(THEMES)('%s: каждый цветовой токен текста и фона покрыт парой', (theme) => {
    expect(uncoveredColorTokens(resolvedTokens(groups, theme), artboard.pairs)).toEqual([]);
  });

  const SYNTHETIC_TOKENS = {
    '--bg-a': 'rgb(1 2 3)',
    '--text-b': 'color-mix(in srgb, #fff 50%, #000)',
    '--bg-c': '#000',
    '--bg-d': 'linear-gradient(180deg, #000, #fff)',
  };
  const SYNTHETIC_PAIRS = [{ text: '--text-x', bg: '--bg-c' }];

  it.each([
    { token: '--bg-a', why: 'цвет в rgb() без пары', uncovered: true },
    { token: '--text-b', why: 'цвет в color-mix() без пары', uncovered: true },
    { token: '--bg-c', why: 'hex с парой', uncovered: false },
    { token: '--bg-d', why: 'градиент — не цвет', uncovered: false },
  ])('проверка покрытия: $token ($why)', ({ token, uncovered }) => {
    const result = uncoveredColorTokens(SYNTHETIC_TOKENS, SYNTHETIC_PAIRS);

    expect(result.includes(token)).toBe(uncovered);
  });
});

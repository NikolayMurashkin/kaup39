import { describe, expect, it } from 'vitest';
import { THEMES } from '@/lib/consts';
import { artboard, resolvedTokens, scssGroups } from '../lib/artboard';
import { contrast, MIN_RATIO, parseHex } from '../lib/contrast';

const groups = scssGroups();

const pairsPerTheme = THEMES.flatMap((theme) =>
  artboard.pairs.map((pair) => ({ theme, pair: `${pair.text} on ${pair.bg}`, ...pair })),
);

describe('контраст пар «текст на фоне» по токенам', () => {
  it.each(pairsPerTheme)('$theme: $pair не ниже 4,5:1', ({ theme, text, bg }) => {
    const tokens = resolvedTokens(groups, theme);
    const foreground = parseHex(tokens[text] ?? '');
    const background = parseHex(tokens[bg] ?? '');

    expect(foreground, `${text} в теме ${theme}: ${tokens[text] ?? 'токена нет'}`).not.toBeNull();
    expect(background, `${bg} в теме ${theme}: ${tokens[bg] ?? 'токена нет'}`).not.toBeNull();
    expect(
      contrast(foreground as [number, number, number], background as [number, number, number]),
    ).toBeGreaterThanOrEqual(MIN_RATIO);
  });

  it.each(THEMES)('%s: каждый цветовой токен текста и фона покрыт парой', (theme) => {
    const tokens = resolvedTokens(groups, theme);
    const colors = Object.keys(tokens).filter(
      (token) => (token.startsWith('--text-') || token.startsWith('--bg-')) && parseHex(tokens[token]),
    );
    const uncovered = colors.filter(
      (token) => !artboard.pairs.some((pair) => pair.text === token || pair.bg === token),
    );

    expect(uncovered).toEqual([]);
  });
});

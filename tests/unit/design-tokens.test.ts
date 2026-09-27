import { describe, expect, it } from 'vitest';
import { readArtboard, type TokenGroup } from '../../scripts/sync-artboard-tokens.mts';
import { artboard, artboardIsReachable, ARTBOARD_PATH, GROUP_RULE, scssGroups, THEME_GROUP } from '../lib/artboard';
import { HEADER_BREAKPOINT, NARROW_BREAKPOINT } from '../lib/consts';
import { normalizeCssValue, readAllMedias } from '../lib/scss';

const groups = scssGroups();

describe('токены направления перенесены из таблицы артборда', () => {
  it.each(artboard.table)('$theme: $token = $value', ({ token, theme, value }) => {
    expect(normalizeCssValue(groups[THEME_GROUP[theme]][token] ?? '')).toBe(normalizeCssValue(value));
  });

  const portable = (Object.keys(GROUP_RULE) as TokenGroup[]).flatMap((group) =>
    Object.entries(artboard.css[group]).map(([token, value]) => ({ group, token, value })),
  );

  it.each(portable)('$group: $token = $value', ({ group, token, value }) => {
    expect(normalizeCssValue(groups[group][token] ?? '')).toBe(normalizeCssValue(value));
  });

  it('во всех стилях два медиазапроса ширины — узкая колонка и свернутая шапка (D34)', () => {
    expect(readAllMedias().sort()).toEqual(
      [`@media (max-width: ${HEADER_BREAKPOINT}px)`, `@media (max-width: ${NARROW_BREAKPOINT}px)`].sort(),
    );
  });

  it('снимок не усечен: столько значений, сколько печатает артборд', () => {
    expect(artboard.table).toHaveLength(69);
    expect(artboard.pairs).toHaveLength(11);
    expect(
      Object.fromEntries(Object.entries(artboard.css).map(([group, tokens]) => [group, Object.keys(tokens).length])),
    ).toEqual({ dark: 41, light: 22, narrow: 9, narrowLight: 1 });
  });

  it('снимок таблицы совпадает с артбордом (на CI артборда нет — сверка идет на маке)', () => {
    if (!artboardIsReachable()) {
      expect(artboard.sha256).toMatch(/^[0-9a-f]{64}$/);

      return;
    }

    expect(readArtboard(ARTBOARD_PATH)).toEqual(artboard);
  });
});

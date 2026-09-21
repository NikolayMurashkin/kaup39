import { describe, expect, it } from 'vitest';
import { readArtboard, type TokenGroup } from '../../scripts/sync-artboard-tokens.mts';
import { artboard, artboardIsReachable, ARTBOARD_PATH, GROUP_RULE, scssGroups, THEME_GROUP } from '../lib/artboard';
import { normalizeCssValue, readTokenRules } from '../lib/scss';

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

  it('узкая ширина объявлена медиазапросом max-width, других медиазапросов в токенах нет', () => {
    const medias = [...new Set(readTokenRules().flatMap((rule) => (rule.media === null ? [] : [rule.media])))];

    expect(medias).toHaveLength(1);
    expect(medias[0]).toMatch(/^@media \(max-width: \d+px\)$/);
  });

  it('снимок таблицы совпадает с артбордом (на CI артборда нет — сверка идет на маке)', () => {
    if (!artboardIsReachable()) {
      expect(artboard.sha256).toMatch(/^[0-9a-f]{64}$/);

      return;
    }

    expect(readArtboard(ARTBOARD_PATH)).toEqual(artboard);
  });
});

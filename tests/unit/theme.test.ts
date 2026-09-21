import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, THEMES } from '@/lib/consts';
import { resolveTheme } from '@/lib/theme';

describe('тема страницы', () => {
  it('основная тема — темная', () => {
    expect(DEFAULT_THEME).toBe('dark');
    expect(THEMES).toEqual(['dark', 'light']);
  });

  it.each(THEMES)('кука %s остается собой', (theme) => {
    expect(resolveTheme(theme)).toBe(theme);
  });

  it.each([undefined, '', 'sepia', 'DARK', 'light '])('значение %o дает основную тему', (value) => {
    expect(resolveTheme(value)).toBe(DEFAULT_THEME);
  });
});

import { cookies } from 'next/headers';
import { DEFAULT_THEME, THEME_COOKIE, THEMES } from './consts';
import type { Theme } from './types';

const isTheme = (value: string | undefined): value is Theme => THEMES.some((theme) => theme === value);

export const getTheme = async (): Promise<Theme> => {
  const value = (await cookies()).get(THEME_COOKIE)?.value;

  return isTheme(value) ? value : DEFAULT_THEME;
};

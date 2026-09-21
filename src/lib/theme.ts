import { cookies } from 'next/headers';
import { DEFAULT_THEME, THEME_COOKIE, THEMES } from './consts';
import type { Theme } from './types';

const isTheme = (value: string | undefined): value is Theme => THEMES.some((theme) => theme === value);

/** Тема из куки: неизвестное значение и пустая кука дают основную, темную. */
export const resolveTheme = (value: string | undefined): Theme => (isTheme(value) ? value : DEFAULT_THEME);

export const getTheme = async (): Promise<Theme> => resolveTheme((await cookies()).get(THEME_COOKIE)?.value);

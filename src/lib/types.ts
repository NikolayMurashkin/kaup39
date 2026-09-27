import type { THEMES } from './consts';

export type Theme = (typeof THEMES)[number];

/** Ссылка навигации: шапка, подвал, меню. `note` — подпись под пунктом в раскрывающемся списке событий. */
export type NavLink = {
  href: string;
  label: string;
  note?: string;
};

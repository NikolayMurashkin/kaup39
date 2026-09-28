import { EVENT_LINKS, SITE_PAGES } from '@/lib/consts';
import type { NavLink } from '@/lib/types';

/** Имя поселения, которое вордмарк набирает рунами. */
export const WORDMARK = 'Кауп';

/** Меню до 1279: главная и шесть страниц демо. */
export const MENU_LINKS: NavLink[] = [{ href: '/', label: 'Главная' }, ...SITE_PAGES];

/** Страницы событий в меню стоят с отступом — как под пунктом «События» шапки. */
export const EVENT_HREFS = new Set(EVENT_LINKS.map((link) => link.href));

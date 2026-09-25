import { DIRECTIONS_PATH, SCHEDULE_PATH } from '../../src/lib/consts';

/** Адрес стенда. Другой — через `STAND_URL=https://… yarn test:stand`. */
export const STAND_URL = process.env.STAND_URL ?? 'https://kaup39.mrshkn.com';

export const STAND_HOST = new URL(STAND_URL).hostname;

/** Страницы демо, которые уже есть. Событие и корпоративы добавляют сюда свои блоки. */
export const DEMO_PATHS = ['/', SCHEDULE_PATH, DIRECTIONS_PATH];

export const SHOWCASE_PATH = '/components';

/** Сертификат поддоменов студии — один wildcard (D24): имя стенда в журнал CT попадать не должно. */
export const WILDCARD_SAN = 'DNS:*.mrshkn.com';

/**
 * Имена, которых на сервере нет: чужой домен, служебное имя контейнера Traefik (по нему из ревью B45 отдавались
 * API и дашборд) и поддомен студии без приложения. Ни одно не должно получить ничего, кроме 404.
 */
export const FOREIGN_HOSTS = ['example.com', 'traefik-coolify-proxy', 'absent.mrshkn.com'];

/** Пути API и дашборда Traefik. */
export const TRAEFIK_PATHS = ['/api/version', '/api/http/routers', '/dashboard/'];

export const SCHEMES = ['http', 'https'] as const;

export const REQUEST_TIMEOUT = 10_000;

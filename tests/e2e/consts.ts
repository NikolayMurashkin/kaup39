import { CAMPING_PATH, DIRECTIONS_PATH, EVENT_PATH, SCHEDULE_PATH } from '../../src/lib/consts';

export { NARROW_BREAKPOINT } from '../lib/consts';
export { DIRECTIONS_PATH, SCHEDULE_PATH, THEME_COOKIE, THEMES } from '../../src/lib/consts';

export const PORT = 3200;

export const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * Второй сервер e2e — та же сборка, что у основного, с окружением стенда: так проверяется, что индексацию
 * закрывает окружение, а не код страниц. Переменные те же, что заданы стенду в Coolify.
 */
export const STAND_PORT = 3201;

export const STAND_BASE_URL = `http://127.0.0.1:${STAND_PORT}`;

export const STAND_ENV = { SITE_ENV: 'stand' };

/** Страницы демо, которые уже есть. Корпоративы добавят сюда свой адрес своим блоком. */
export const DEMO_PATHS = ['/', SCHEDULE_PATH, DIRECTIONS_PATH, `${EVENT_PATH}/proverka-dnem`, CAMPING_PATH];

/**
 * База e2e-сервера: своя, с проверочным контентом из `tests/e2e/seed/`. На CI адрес приходит из сервиса
 * Postgres, локально это тот же контейнер, что и у рабочей базы.
 */
export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgres://kaup39:kaup39@127.0.0.1:5433/kaup39_e2e';

/** Медиатека e2e-сервера: проверочные кадры не мешаются с фотографиями владельцев в `media/`. */
export const E2E_MEDIA_DIR = 'media-e2e';

/** Тесты, которые меняют e2e-базу: они идут отдельным проектом после всех остальных. */
export const STATE_SPECS = /\.state\.spec\.ts$/;

/**
 * Сколько видимых текстовых узлов главной несут длинное слово засева. Число закреплено: проверка
 * переносов не должна проходить потому, что длинный текст пропал со страницы.
 */
export const MIN_LONG_TEXT_NODES = 18;

/** Обе ширины артборда: 1440 — широкая доска, 390 — узкая. */
export const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
] as const;

/** Служебная витрина компонентов направления: в пять страниц демо не входит. */
export const SHOWCASE_PATH = '/components';

/**
 * Сколько цен стоит на витрине: четыре отдельных образца, две в карточках событий и одна
 * в панели ближайшего. Число закреплено, а не взято с запасом: убрать образец с витрины —
 * значит снять проверку с целого компонента, и это должно быть видно по упавшему тесту.
 */
export const MIN_PRICES = 7;

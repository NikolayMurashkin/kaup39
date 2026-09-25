import { STAND_SITE_ENV } from './consts';

/** Читается на каждый запрос: переменная приходит окружением сервера, а не вшивается в сборку. */
export const isStand = () => process.env.SITE_ENV === STAND_SITE_ENV;

import { getPayload } from 'payload';
import config from './payload.config';

/**
 * Сайт в базу не пишет, подъем нужен ради миграций (`MIGRATE_ON_START`): схема создается до первого запроса, а не на
 * нем. Задач по расписанию у «Каупа» пока нет; `cron: true` стоит для единообразия с остальными приложениями студии —
 * появятся задачи, cron уже включен. Подъем упал — выход с ненулевым кодом: хостинг не пустит трафик на контейнер без
 * базы и оставит прежний.
 */
export const startPayload = async () => {
  try {
    await getPayload({ config, cron: true });
  } catch (error) {
    console.error('Payload не поднялся при старте «Каупа»:', error);
    process.exit(1);
  }
};

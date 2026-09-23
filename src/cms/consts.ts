import type { TariffKind } from './types';

/**
 * Каталог медиатеки Payload. Путь относительный, и Payload отдает его файловой системе как есть, то есть
 * от рабочего каталога процесса — корня репозитория. Фотографии владельцев живут здесь и в git не попадают.
 */
export const MEDIA_DIR = 'media';

/** Единственная касса демо. */
export const TICKET_HOST = 'radario.ru';

/** Вторая касса исходного сайта: ссылок на нее нет нигде, в том числе в разделах страниц. */
export const FOREIGN_TICKET_HOST = 'edinoepole.ru';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/** Часовой пояс поселения: день даты считается по Калининграду, а не по часам сервера. */
export const SETTLEMENT_TIME_ZONE = 'Europe/Kaliningrad';

export const TARIFF_LABELS: Record<TariffKind, string> = {
  entry: 'Входной',
  adult: 'Взрослый',
  child: 'Детский',
  family22: 'Семейный, 2 взрослых + 2 детских',
  family21: 'Семейный, 2 взрослых + 1 детский',
};

/** Страницы демо, чьи тексты живут в коллекции `pages`. */
export const PAGE_LABELS = {
  home: 'Главная',
  directions: 'Как доехать',
  corporate: 'Корпоративы и свадьбы',
} as const;

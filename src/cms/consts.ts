import type { TariffKind, ZoneMark } from './types';

/**
 * Каталог медиатеки Payload. Путь относительный, и Payload отдает его файловой системе как есть, то есть
 * от рабочего каталога процесса — корня репозитория. Это данные CMS, а не исходники, поэтому каталог в git не попадает.
 */
export const DEFAULT_MEDIA_DIR = 'media';

/** e2e-сервер и Lighthouse на CI работают со своей медиатекой, чтобы проверочные кадры не мешались с фотографиями владельцев. */
export const MEDIA_DIR = process.env.MEDIA_DIR ?? DEFAULT_MEDIA_DIR;

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

/**
 * Якоря разделов главной, к которым страница пристраивает данные из коллекций: ленту ближайших дат,
 * плитки площадок, таверны. Раздел без такого якоря рисуется как обычный, а данные встают в конец страницы.
 */
export const HOME_ANCHORS = { events: 'events', zones: 'zones', kitchen: 'kitchen', camping: 'camping' } as const;

/** Разделы страницы «как доехать», из которых главная собирает плашку трансфера. */
export const DIRECTIONS_ANCHORS = { transfer: 'transfer', transferPrice: 'transfer-price' } as const;

/** Страницы демо, чьи тексты живут в коллекции `pages`. */
export const PAGE_LABELS = {
  home: 'Главная',
  directions: 'Как доехать',
  corporate: 'Корпоративы и свадьбы',
} as const;

/** Знаки площадок: рисуются символами спрайта направления, в админке выбираются по названию. */
export const ZONE_MARK_LABELS: Record<ZoneMark, string> = {
  house: 'Дом',
  forge: 'Наковальня',
  pot: 'Горшок',
  bow: 'Лук',
  shield: 'Щит',
  ship: 'Ладья',
  hall: 'Зал',
  horn: 'Рог',
};

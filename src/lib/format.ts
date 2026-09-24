import { MONTHS_GENITIVE, SHORT_WORDS, WEEKDAYS } from './consts';

const NBSP = ' ';

/** Дата `YYYY-MM-DD` как день календаря: без часового пояса, чтобы день не съезжал ни на сервере, ни у зрителя. */
const calendarDay = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, day));
};

/** «27 сентября». */
export const formatDay = (date: string) => {
  const day = calendarDay(date);

  return `${day.getUTCDate()} ${MONTHS_GENITIVE[day.getUTCMonth()]}`;
};

/** «воскресенье». */
export const formatWeekday = (date: string) => WEEKDAYS[calendarDay(date).getUTCDay()];

/** Сумма в рублях: четырехзначные слитно, от десяти тысяч — разряды через неразрывный пробел. */
export const formatAmount = (amount: number) => {
  const digits = String(amount);

  return digits.length < 5 ? digits : digits.replace(/\B(?=(\d{3})+$)/g, NBSP);
};

const shortWord = new RegExp(`(?<=^|[\\s(«„"—-])(${SHORT_WORDS.join('|')}) `, 'giu');

/**
 * Типограф текстов из CMS: после коротких предлогов, союзов и частиц — неразрывный пробел, чтобы
 * «в», «и», «на» не висели в конце строки. В базе тексты хранятся без него, ставится он при отрисовке.
 */
export const typograph = (text: string) => text.replace(shortWord, `$1${NBSP}`);

/** Абзацы текстового поля CMS: разделяются пустой строкой. */
export const paragraphs = (text: string | null | undefined) =>
  (text ?? '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(typograph);

/** Ссылка для звонка: «8 (4012) 37-99-26» и «+7 (4012) 37-99-26» → `tel:+74012379926`. */
export const phoneHref = (phone: string) => {
  const digits = phone.replace(/\D/g, '');

  return `tel:${phone.trim().startsWith('+') ? `+${digits}` : digits.replace(/^8(?=\d{10}$)/, '+7')}`;
};

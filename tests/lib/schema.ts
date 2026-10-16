/**
 * Структурная проверка JSON-LD по schema.org и обязательным полям Google: своей библиотеки у schema.org нет, пакет
 * ради тестов не ставим. Возвращает список проблем с путем до поля; пустой список — разметка годится.
 */

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const typesOf = (value: Json): string[] => {
  const type = value['@type'];

  if (typeof type === 'string') return [type];
  if (Array.isArray(type)) return type.filter((item): item is string => typeof item === 'string');

  return [];
};

const isAbsoluteUrl = (value: unknown) =>
  typeof value === 'string' && URL.canParse(value) && ['http:', 'https:'].includes(new URL(value).protocol);

/** ISO 8601 со смещением или `Z`: без смещения Google считает время по своему поясу. */
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

const isFilledString = (value: unknown) => typeof value === 'string' && value.trim() !== '';

/** Пустые значения в любой глубине: `null`, `undefined`, пустая строка, `NaN`. */
const emptyProblems = (value: unknown, at: string): string[] => {
  if (value === null) return [`${at}: null`];
  if (value === undefined) return [`${at}: undefined`];
  if (typeof value === 'string' && value.trim() === '') return [`${at}: пустая строка`];
  if (typeof value === 'number' && Number.isNaN(value)) return [`${at}: NaN`];
  if (Array.isArray(value)) return value.flatMap((item, index) => emptyProblems(item, `${at}[${index}]`));
  if (isObject(value)) return Object.entries(value).flatMap(([key, item]) => emptyProblems(item, `${at}.${key}`));

  return [];
};

/** Адреса `url` в любой глубине и `sameAs[]` — абсолютные http(s). */
const urlProblems = (value: unknown, at: string): string[] => {
  if (Array.isArray(value)) return value.flatMap((item, index) => urlProblems(item, `${at}[${index}]`));
  if (!isObject(value)) return [];

  const own = [
    ...('url' in value && !isAbsoluteUrl(value.url)
      ? [`${at}.url: не абсолютный адрес http(s): ${String(value.url)}`]
      : []),
    ...('sameAs' in value
      ? [value.sameAs]
          .flat()
          .flatMap((item, index) =>
            isAbsoluteUrl(item) ? [] : [`${at}.sameAs[${index}]: не абсолютный адрес http(s): ${String(item)}`],
          )
      : []),
  ];

  return [...own, ...Object.entries(value).flatMap(([key, item]) => urlProblems(item, `${at}.${key}`))];
};

const inRange = (value: unknown, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

const postalAddressProblems = (address: unknown, at: string) => {
  if (!isObject(address) || !typesOf(address).includes('PostalAddress')) return [`${at}: не PostalAddress`];

  return [
    ...(isFilledString(address.streetAddress) ? [] : [`${at}.streetAddress: нет`]),
    ...(isFilledString(address.addressCountry) ? [] : [`${at}.addressCountry: нет`]),
  ];
};

const geoProblems = (geo: unknown, at: string) => {
  if (!isObject(geo) || !typesOf(geo).includes('GeoCoordinates')) return [`${at}: не GeoCoordinates`];

  return [
    ...(inRange(geo.latitude, -90, 90) ? [] : [`${at}.latitude: не число от -90 до 90`]),
    ...(inRange(geo.longitude, -180, 180) ? [] : [`${at}.longitude: не число от -180 до 180`]),
  ];
};

const localBusinessProblems = (item: Json, at: string) => [
  ...(isFilledString(item.name) ? [] : [`${at}.name: нет`]),
  ...postalAddressProblems(item.address, `${at}.address`),
  ...('geo' in item ? geoProblems(item.geo, `${at}.geo`) : []),
];

const placeProblems = (location: unknown, at: string) => {
  if (!isObject(location) || !typesOf(location).includes('Place')) return [`${at}: не Place`];

  return [
    ...(isFilledString(location.name) ? [] : [`${at}.name: нет`]),
    ...(isFilledString(location.address) || isObject(location.address) ? [] : [`${at}.address: нет`]),
  ];
};

const offerProblems = (offers: unknown, at: string) => {
  if (!isObject(offers) || !typesOf(offers).includes('Offer')) return [`${at}: не Offer`];

  return [
    ...(typeof offers.price === 'number' && Number.isFinite(offers.price) && offers.price >= 0
      ? []
      : [`${at}.price: не число от 0`]),
    ...(typeof offers.priceCurrency === 'string' && /^[A-Z]{3}$/.test(offers.priceCurrency)
      ? []
      : [`${at}.priceCurrency: не код валюты из трех заглавных букв`]),
  ];
};

const eventProblems = (item: Json, at: string) => [
  ...(isFilledString(item.name) ? [] : [`${at}.name: нет`]),
  ...(['startDate', 'endDate'] as const).flatMap((key) =>
    typeof item[key] === 'string' && ISO_WITH_OFFSET.test(item[key])
      ? []
      : [`${at}.${key}: не ISO 8601 со смещением: ${String(item[key])}`],
  ),
  ...placeProblems(item.location, `${at}.location`),
  ...offerProblems(item.offers, `${at}.offers`),
];

export const schemaProblems = (data: unknown): string[] => {
  if (!isObject(data)) return ['$: не объект'];

  const types = typesOf(data);
  const type = data['@type'];
  const typeIsValid =
    typeof type === 'string' ? type !== '' : Array.isArray(type) && type.length > 0 && types.length === type.length;

  return [
    ...(data['@context'] === 'https://schema.org'
      ? []
      : [`$.@context: не https://schema.org: ${String(data['@context'])}`]),
    ...(typeIsValid ? [] : ['$.@type: не строка и не массив строк']),
    ...emptyProblems(data, '$'),
    ...urlProblems(data, '$'),
    ...(types.includes('LocalBusiness') ? localBusinessProblems(data, '$') : []),
    ...(types.includes('Event') ? eventProblems(data, '$') : []),
  ];
};

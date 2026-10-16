import { describe, expect, it } from 'vitest';
import { eventJsonLd, jsonLdScript } from '@/lib/event-jsonld';
import { homeJsonLd, type HomeJsonLdInput } from '@/lib/home-jsonld';
import { schemaProblems } from '../lib/schema';

/** Проверочный сайт: данные придуманы для теста и владельцам не принадлежат. */
const SITE: HomeJsonLdInput = {
  name: 'Проверочное поселение',
  description: 'Проверочный подзаголовок поселения',
  address: 'Проверочная область, проверочный район, 1 км от проверочного поселка',
  phone: '+7 (000) 000-00-00',
  email: 'test@example.com',
  map: { latitude: 54.95, longitude: 20.25 },
  socials: [{ url: 'https://example.com/vk' }, { url: 'https://example.com/telegram' }],
};

/** Домен владельцев: разметка главной собрана для боевого сайта, а не для стенда. */
const OWNERS_HOME = 'https://kaup39.ru/';

describe('JSON-LD главной', () => {
  it('полный сайт — один объект TouristAttraction и LocalBusiness с контактами, адресом, точкой и соцсетями', () => {
    const data = homeJsonLd(SITE);

    expect(Array.isArray(data)).toBe(false);
    expect(data['@type']).toEqual(expect.arrayContaining(['TouristAttraction', 'LocalBusiness']));
    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      name: SITE.name,
      description: SITE.description,
      url: OWNERS_HOME,
      telephone: SITE.phone,
      email: SITE.email,
      address: { '@type': 'PostalAddress', streetAddress: SITE.address, addressCountry: 'RU' },
      geo: { '@type': 'GeoCoordinates', latitude: 54.95, longitude: 20.25 },
      sameAs: ['https://example.com/vk', 'https://example.com/telegram'],
    });
    expect(data.address).toEqual({ '@type': 'PostalAddress', streetAddress: SITE.address, addressCountry: 'RU' });
    expect(schemaProblems(data)).toEqual([]);
  });

  it.each([
    { case: 'всего нет', map: null, socials: null, description: null },
    {
      case: 'одной координаты нет, списки пустые',
      map: { latitude: null, longitude: 20.25 },
      socials: [],
      description: '',
    },
  ])('нет точки карты, соцсетей и подзаголовка ($case) — нет и ключей geo, sameAs, description', (missing) => {
    const data = homeJsonLd({
      ...SITE,
      map: missing.map,
      socials: missing.socials,
      description: missing.description,
    });

    expect(data).toMatchObject({ '@context': 'https://schema.org', name: SITE.name, url: OWNERS_HOME });
    expect(data).not.toHaveProperty('geo');
    expect(data).not.toHaveProperty('sameAs');
    expect(data).not.toHaveProperty('description');
    expect(schemaProblems(data)).toEqual([]);
  });

  it('название с </script> не закрывает тег разметки и читается обратно без изменений', () => {
    const name = 'Проверочное </script><script>alert(1)</script> поселение';
    const script = jsonLdScript(homeJsonLd({ ...SITE, name }));

    expect(script).not.toContain('</script');
    expect(script).not.toContain('<script');
    expect((JSON.parse(script) as { name?: unknown }).name).toBe(name);
  });
});

describe('JSON-LD страницы события по схеме', () => {
  it('каждый объект Event от проверочного события с двумя будущими датами валиден', () => {
    const items = eventJsonLd(
      {
        title: 'Проверочное событие',
        ticketUrl: 'https://radario.ru/widgets/proverka',
        tariffs: [
          { kind: 'adult', amount: 1000 },
          { kind: 'child', amount: 700 },
        ],
        dates: [
          { date: '2026-10-17', start: '12:00', end: '15:00' },
          { date: '2026-10-24', start: '18:00', end: '22:00' },
        ],
        place: { name: 'Проверочное поселение', address: 'Проверочная область, проверочный район' },
      },
      new Date('2026-10-12T10:00:00Z'),
    );

    expect(items).toHaveLength(2);

    for (const item of items) {
      expect(schemaProblems(item)).toEqual([]);
    }
  });
});

/** Образцы, у которых валидатор обязан найти проблему: иначе он пропускает все. */
const VALID_BUSINESS = {
  '@context': 'https://schema.org',
  '@type': ['TouristAttraction', 'LocalBusiness'],
  name: 'Проверочное поселение',
  url: 'https://example.com/',
  address: { '@type': 'PostalAddress', streetAddress: 'Проверочный адрес', addressCountry: 'RU' },
};

const VALID_EVENT = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Проверочное событие',
  startDate: '2026-10-17T12:00:00+02:00',
  endDate: '2026-10-17T15:00:00+02:00',
  location: { '@type': 'Place', name: 'Проверочное поселение', address: 'Проверочный адрес' },
  offers: { '@type': 'Offer', price: 700, priceCurrency: 'RUB', url: 'https://example.com/bilet' },
};

const without = (data: Record<string, unknown>, key: string) =>
  Object.fromEntries(Object.entries(data).filter(([name]) => name !== key));

describe('валидатор разметки', () => {
  it.each([
    { case: 'без name', valid: VALID_EVENT, broken: without(VALID_EVENT, 'name') },
    { case: 'без address', valid: VALID_BUSINESS, broken: without(VALID_BUSINESS, 'address') },
    { case: "url: '/raspisanie'", valid: VALID_BUSINESS, broken: { ...VALID_BUSINESS, url: '/raspisanie' } },
    {
      case: 'price: null',
      valid: VALID_EVENT,
      broken: { ...VALID_EVENT, offers: { ...VALID_EVENT.offers, price: null } },
    },
    {
      case: "startDate: '2026-10-17 12:00'",
      valid: VALID_EVENT,
      broken: { ...VALID_EVENT, startDate: '2026-10-17 12:00' },
    },
    {
      case: "@context: 'http://schema.org/'",
      valid: VALID_BUSINESS,
      broken: { ...VALID_BUSINESS, '@context': 'http://schema.org/' },
    },
  ])('образец $case не проходит', ({ valid, broken }) => {
    expect(schemaProblems(valid)).toEqual([]);
    expect(schemaProblems(broken)).not.toEqual([]);
  });
});

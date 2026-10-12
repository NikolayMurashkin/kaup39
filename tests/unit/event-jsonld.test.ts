import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EVENT_FACTS } from '@/cms/facts';
import { eventJsonLd, jsonLdScript, type EventJsonLdInput } from '@/lib/event-jsonld';

const DENVIKINGI = EVENT_FACTS.find((fact) => fact.slug === 'denvikingi')!;
const RAGNAREK = EVENT_FACTS.find((fact) => fact.slug === 'ragnarek')!;

const PLACE = {
  name: 'Поселение эпохи викингов «Кауп»',
  address: 'Калининградская область, Зеленоградский район, 4 км от п. Романово',
};

const day = (date: string) => ({ date, start: '12:00', end: '15:00' });

const input = (dates: EventJsonLdInput['dates'], overrides: Partial<EventJsonLdInput> = {}): EventJsonLdInput => ({
  title: 'День с викингами',
  ticketUrl: DENVIKINGI.ticketUrl,
  tariffs: [{ kind: 'entry', amount: 700 }],
  dates,
  place: PLACE,
  ...overrides,
});

const OCTOBER = [day('2026-10-10'), day('2026-10-17'), day('2026-10-24')];

/** Адрес места строкой или строкой внутри `PostalAddress`: оба вида schema.org допускает. */
const addressText = (address: unknown) => (typeof address === 'string' ? address : JSON.stringify(address ?? null));

/** Выгрузка исходного сайта лежит в плановой части студии и в git не входит: на CI ее нет. */
const SOURCE_HTML = fileURLToPath(new URL('../../../research/kaup39/html/', import.meta.url));

describe('JSON-LD события', () => {
  it('на каждую будущую дату — Event с названием, началом и концом по Калининграду, местом и билетом', () => {
    const items = eventJsonLd(input(OCTOBER), new Date('2026-10-12T10:00:00Z'));

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.startDate)).toEqual(['2026-10-17T12:00:00+02:00', '2026-10-24T12:00:00+02:00']);
    expect(items.map((item) => item.endDate)).toEqual(['2026-10-17T15:00:00+02:00', '2026-10-24T15:00:00+02:00']);

    for (const item of items) {
      expect(item).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'День с викингами',
        location: { '@type': 'Place', name: PLACE.name },
        offers: { '@type': 'Offer', price: 700, priceCurrency: 'RUB', url: DENVIKINGI.ticketUrl },
      });
      expect(addressText((item.location as { address?: unknown }).address)).toContain(PLACE.address);
    }
  });

  it('сегодняшняя дата в разметке, пока идет, и пропадает, когда закончилась', () => {
    const today = [day('2026-10-12'), day('2026-10-17')];

    // 14:00 по Калининграду
    const during = eventJsonLd(input(today), new Date('2026-10-12T12:00:00Z'));

    expect(during).toHaveLength(2);
    expect(during.map((item) => item.startDate)).toEqual(['2026-10-12T12:00:00+02:00', '2026-10-17T12:00:00+02:00']);

    // 16:00 по Калининграду
    const after = eventJsonLd(input(today), new Date('2026-10-12T14:00:00Z'));

    expect(after).toHaveLength(1);
    expect(after.map((item) => item.startDate)).toEqual(['2026-10-17T12:00:00+02:00']);
  });

  it('будущих дат нет — разметки нет', () => {
    expect(eventJsonLd(input(OCTOBER), new Date('2026-10-25T12:00:00Z'))).toEqual([]);
  });

  it('видов билета несколько — в offers самый дешевый', () => {
    const tariffs = RAGNAREK.tariffs;

    expect(tariffs.map((tariff) => tariff.amount)).toEqual([1000, 700, 2700, 2300]);

    const [item] = eventJsonLd(
      input([day('2026-10-17')], { title: 'Рагнарек', ticketUrl: RAGNAREK.ticketUrl, tariffs }),
      new Date('2026-10-12T10:00:00Z'),
    );

    expect(item?.offers).toMatchObject({ '@type': 'Offer', price: 700, priceCurrency: 'RUB', url: RAGNAREK.ticketUrl });
  });

  it('текст из CMS с </script> не закрывает тег разметки, а JSON читается обратно', () => {
    const title = 'День </script><script>alert(1)</script> с викингами';
    const json = jsonLdScript(eventJsonLd(input([day('2026-10-17')], { title }), new Date('2026-10-12T10:00:00Z')));

    expect(json.toLowerCase()).not.toContain('</script');
    expect(json.toLowerCase()).not.toContain('<script');

    const parsed = JSON.parse(json) as { name?: unknown }[];

    expect(parsed.map((item) => item.name)).toEqual([title]);
  });

  it.skipIf(!existsSync(SOURCE_HTML))('у исходного сайта разметки нет ни на одной из 33 страниц', () => {
    const pages = readdirSync(SOURCE_HTML).filter((file) => file.endsWith('.html'));

    expect(pages).toHaveLength(33);
    expect(
      pages.filter((file) => readFileSync(path.join(SOURCE_HTML, file), 'utf8').includes('application/ld+json')),
    ).toEqual([]);
  });
});

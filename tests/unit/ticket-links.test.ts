import type { Field } from 'payload';
import { describe, expect, it } from 'vitest';
import { Events } from '@/cms/collections/Events';
import { EVENT_FACTS } from '@/cms/facts';
import { COLLECTIONS, GLOBALS } from '@/cms/schema';
import { validateLinkUrl, validateOptionalLinkUrl, validateTicketUrl } from '@/cms/validate';

const RADARIO =
  'https://radario.ru/customer/afisha/07491522457ccd14ae0cf241ef5615b0c4390638501d5eb?openAsLinkKey=97088c52oc';

/** Все поля на любой глубине: группы, массивы, строки, вкладки и блоки раскрываются. */
const flatten = (fields: Field[]): Field[] =>
  fields.flatMap((field) => {
    if ('fields' in field) return [field, ...flatten(field.fields)];
    if (field.type === 'tabs') return flatten(field.tabs.flatMap((tab) => tab.fields));
    if (field.type === 'blocks') return [field, ...flatten((field.blocks ?? []).flatMap((block) => block.fields))];

    return [field];
  });

const namedFields = (fields: Field[] = Events.fields) => flatten(fields).filter((field) => 'name' in field);

const linkFields = (fields: Field[]) =>
  namedFields(fields).filter((field) => field.type === 'text' && /url|link|href/i.test(field.name));

describe('ни одна запись events не ссылается на edinoepole.ru', () => {
  it('у каждого события сидов ссылка на кассу ведет на radario.ru', () => {
    expect(EVENT_FACTS.length).toBeGreaterThan(0);

    const foreign = EVENT_FACTS.filter(
      ({ ticketUrl }) => new URL(ticketUrl).hostname !== 'radario.ru' || validateTicketUrl(ticketUrl) !== true,
    );

    expect(foreign).toEqual([]);
  });

  it.each([
    'https://kaup39.edinoepole.ru/widget/events?date_from=2026-01-01',
    'https://edinoepole.ru/',
    'https://https://radario.ru/customer/afisha/07491521ea938c385fb68282cbed6dd9067154ee051c887',
    'http://radario.ru/customer/afisha/07491522457ccd14ae0cf241ef5615b0c4390638501d5eb',
    'https://radario.ru.example.com/customer/afisha/0749152',
    'https://example.com/?next=https://radario.ru/customer/afisha/0749152',
    'radario.ru/customer/afisha/0749152',
    '',
  ])('валидатор кассы отклоняет «%s»', (url) => {
    expect(validateTicketUrl(url)).toEqual(expect.any(String));
  });

  it('валидатор кассы пропускает билет Radario', () => {
    expect(validateTicketUrl(RADARIO)).toBe(true);
  });

  it('ссылка на кассу в events обязательна и защищена валидатором — из админки edinoepole.ru не сохранить', () => {
    const ticketUrl = namedFields().find((field) => 'name' in field && field.name === 'ticketUrl');

    expect(ticketUrl).toMatchObject({ type: 'text', required: true, validate: validateTicketUrl });
  });

  it('других полей-ссылок в events нет: кассу не обойти вторым адресом', () => {
    const links = namedFields()
      .map((field) => ('name' in field ? field.name : ''))
      .filter((name) => /url|link|href|ticket/i.test(name));

    expect(links).toEqual(['ticketUrl']);
  });
});

describe('ссылки в разделах страниц и в соцсетях тоже не ведут на edinoepole.ru', () => {
  it('каждое поле-ссылка всех коллекций и глобалов конфига проверяется валидатором кассы или ссылок', () => {
    const fields = [...COLLECTIONS, ...GLOBALS].flatMap((config) => linkFields(config.fields));
    const validators = [validateTicketUrl, validateLinkUrl, validateOptionalLinkUrl];

    expect(fields.length).toBeGreaterThanOrEqual(4);
    expect(fields.filter((field) => !('validate' in field) || !validators.includes(field.validate as never))).toEqual(
      [],
    );
  });

  it.each([
    'https://kaup39.edinoepole.ru/widget/events',
    'https://edinoepole.ru/',
    'https://edinoepole.ru./',
    'https://kaup39.edinoepole.ru./widget/events',
    'https://edinoepole.ru%2E/',
    'https://edinoepol%65.ru/',
    'https://https://edinoepole.ru/',
    'http://example.com/',
    'example.com/raspisanie',
    '',
  ])('валидатор ссылок отклоняет «%s»', (url) => {
    expect(validateLinkUrl(url)).toEqual(expect.any(String));
  });

  it('валидатор ссылок пропускает обычный https-адрес и кассу Radario, а пустая необязательная ссылка проходит', () => {
    expect(validateLinkUrl('https://example.com/raspisanie')).toBe(true);
    expect(validateLinkUrl(RADARIO)).toBe(true);
    expect(validateOptionalLinkUrl('')).toBe(true);
    expect(validateOptionalLinkUrl('https://kaup39.edinoepole.ru/')).toEqual(expect.any(String));
  });
});

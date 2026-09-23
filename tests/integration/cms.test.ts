import config from '@payload-config';
import { getPayload, type Payload } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getSchedule } from '@/cms/schedule';

const RADARIO = 'https://radario.ru/customer/afisha/07491522457ccd14ae0cf241ef5615b0c4390638501d5eb';

/** Проверочные данные теста — не контент владельцев. */
const eventData = (slug: string, ticketUrl: string) => ({
  title: 'Проверочное событие',
  slug,
  ticketUrl,
  tariffs: [{ kind: 'entry' as const, amount: 700 }],
});

/** Отказ Payload по полю ссылки на кассу с сообщением нашего валидатора, а не по любой другой причине. */
const TICKET_REJECTION = {
  data: {
    errors: [expect.objectContaining({ path: 'ticketUrl', message: expect.stringContaining('кассу Radario') })],
  },
};

/** Так дату без времени хранит Payload: полдень UTC, чтобы день не съехал ни в одном часовом поясе. */
const dayOnly = (date: string) => `${date}T12:00:00.000Z`;

let payload: Payload;

beforeAll(async () => {
  payload = await getPayload({ config });
});

afterAll(async () => {
  await payload.destroy();
});

describe('контент-слой на Postgres', () => {
  it('событие со ссылкой на edinoepole.ru не сохраняется ни созданием, ни правкой', async () => {
    await expect(
      payload.create({
        collection: 'events',
        data: eventData('proverka-edinoe-pole', 'https://kaup39.edinoepole.ru/widget/events'),
      }),
    ).rejects.toMatchObject(TICKET_REJECTION);

    const event = await payload.create({ collection: 'events', data: eventData('proverka-pravka', RADARIO) });

    await expect(
      payload.update({
        collection: 'events',
        id: event.id,
        data: { ticketUrl: 'https://kaup39.edinoepole.ru/widget/events' },
      }),
    ).rejects.toMatchObject(TICKET_REJECTION);
  });

  it('дата и цена, измененные в CMS, сразу видны в данных страниц — кеша между ними нет', async () => {
    const event = await payload.create({ collection: 'events', data: eventData('proverka-raspisanie', RADARIO) });
    const entry = await payload.create({
      collection: 'schedule',
      data: { event: event.id, date: dayOnly('2026-10-10'), start: '12:00', end: '15:00' },
    });
    const ofEvent = async () => (await getSchedule()).filter((item) => item.event.slug === 'proverka-raspisanie');

    expect(await ofEvent()).toEqual([
      expect.objectContaining({ date: '2026-10-10', start: '12:00', tariffs: [{ kind: 'entry', amount: 700 }] }),
    ]);

    await payload.update({ collection: 'schedule', id: entry.id, data: { date: dayOnly('2026-10-17') } });
    await payload.update({ collection: 'events', id: event.id, data: { tariffs: [{ kind: 'entry', amount: 800 }] } });

    expect(await ofEvent()).toEqual([
      expect.objectContaining({ date: '2026-10-17', start: '12:00', tariffs: [{ kind: 'entry', amount: 800 }] }),
    ]);
  });
});

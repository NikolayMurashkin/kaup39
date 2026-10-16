import config from '@payload-config';
import { getPayload, type Payload, type RequiredDataFromCollectionSlug } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getHome } from '@/cms/home';
import type { MapPoint } from '@/payload-types';

type MapPointData = RequiredDataFromCollectionSlug<'map-points'>;

/** Проверочные данные теста — не контент владельцев; slug с префиксом теста, чтобы убрать за собой. */
const PREFIX = 'karta-';

const pointData = (slug: string, extra: Partial<MapPointData> = {}): MapPointData => ({
  number: 4,
  name: 'Проверочная точка',
  slug: `${PREFIX}${slug}`,
  x: 50,
  y: 50,
  ...extra,
});

/** Отказ валидации Payload по своему полю, а не по любой другой причине. */
const rejectedAt = (path: string) => ({
  name: 'ValidationError',
  data: { errors: expect.arrayContaining([expect.objectContaining({ path })]) },
});

let payload: Payload;
let zoneId: number;
let tavernId: number;
let eventId: number;

const countOf = async (slug: string) =>
  (await payload.count({ collection: 'map-points', where: { slug: { equals: `${PREFIX}${slug}` } } })).totalDocs;

const relatedId = (value: unknown) =>
  typeof value === 'object' && value !== null ? (value as { id: number }).id : value;

beforeAll(async () => {
  payload = await getPayload({ config });

  zoneId = (
    await payload.create({
      collection: 'zones',
      data: { name: 'Проверочная площадка карты', slug: `${PREFIX}zona`, order: 1 },
    })
  ).id;
  tavernId = (
    await payload.create({
      collection: 'taverns',
      data: { name: 'Проверочная таверна карты', slug: `${PREFIX}taverna`, order: 1 },
    })
  ).id;
  eventId = (
    await payload.create({
      collection: 'events',
      data: {
        title: 'Проверочное событие карты',
        slug: `${PREFIX}sobytie`,
        ticketUrl: 'https://radario.ru/customer/afisha/proverka-karta',
        tariffs: [{ kind: 'entry', amount: 700 }],
      },
    })
  ).id;
});

afterAll(async () => {
  await payload.delete({ collection: 'map-points', where: { slug: { like: PREFIX } } });
  await payload.delete({ collection: 'events', id: eventId });
  await payload.delete({ collection: 'taverns', id: tavernId });
  await payload.delete({ collection: 'zones', id: zoneId });
  await payload.destroy();
});

describe('коллекция точек карты', () => {
  it('точка с номером, названием, slug и координатами на границах 0 и 100 сохраняется и читается обратно', async () => {
    const created = await payload.create({
      collection: 'map-points',
      data: pointData('granicy', { number: 7, name: 'Точка на краю', x: 0, y: 100 }),
    });

    expect(await payload.findByID({ collection: 'map-points', id: created.id })).toMatchObject({
      number: 7,
      name: 'Точка на краю',
      slug: `${PREFIX}granicy`,
      x: 0,
      y: 100,
    });
  });

  it.each([
    ['x', -0.01],
    ['x', 100.01],
    ['x', -5],
    ['x', 150],
    ['y', -0.01],
    ['y', 100.01],
    ['y', -5],
    ['y', 150],
  ] as const)('%s = %s вне 0–100 не сохраняется', async (field, value) => {
    const slug = `vne-${field}-${String(value).replace(/\W/g, '')}`;

    await expect(
      payload.create({ collection: 'map-points', data: pointData(slug, { [field]: value }) }),
    ).rejects.toMatchObject(rejectedAt(field));
    expect(await countOf(slug)).toBe(0);
  });

  it.each([
    ['drob', 2.5],
    ['nol', 0],
  ] as const)('номер не целый или меньше 1 (%s: %s) не сохраняется', async (label, value) => {
    const slug = `nomer-${label}`;

    await expect(
      payload.create({ collection: 'map-points', data: pointData(slug, { number: value }) }),
    ).rejects.toMatchObject(rejectedAt('number'));
    expect(await countOf(slug)).toBe(0);
  });

  it('правка x на 101 не проходит, в базе прежний x', async () => {
    const created = await payload.create({ collection: 'map-points', data: pointData('pravka', { x: 42.5 }) });

    await expect(payload.update({ collection: 'map-points', id: created.id, data: { x: 101 } })).rejects.toMatchObject(
      rejectedAt('x'),
    );
    expect((await payload.findByID({ collection: 'map-points', id: created.id })).x).toBe(42.5);
  });

  it('связь — с площадкой или таверной, с depth 1 отдает документ; связь с событием не сохраняется', async () => {
    const created = await payload.create({
      collection: 'map-points',
      data: pointData('svyaz', { link: { relationTo: 'zones', value: zoneId } }),
    });
    const linkOf = async () =>
      (await payload.findByID({ collection: 'map-points', id: created.id, depth: 1 })).link as
        { relationTo: string; value: unknown } | null | undefined;

    expect((await linkOf())?.relationTo).toBe('zones');
    expect((await linkOf())?.value).toMatchObject({ id: zoneId, slug: `${PREFIX}zona` });

    await payload.update({
      collection: 'map-points',
      id: created.id,
      data: { link: { relationTo: 'taverns', value: tavernId } },
    });

    expect((await linkOf())?.relationTo).toBe('taverns');
    expect((await linkOf())?.value).toMatchObject({ id: tavernId, slug: `${PREFIX}taverna` });

    await expect(
      payload.update({
        collection: 'map-points',
        id: created.id,
        data: { link: { relationTo: 'events', value: eventId } } as unknown as Partial<MapPointData>,
      }),
    ).rejects.toThrow();
    expect((await linkOf())?.relationTo).toBe('taverns');

    await expect(
      payload.create({
        collection: 'map-points',
        data: pointData('svyaz-sobytie', {
          link: { relationTo: 'events', value: eventId },
        } as unknown as Partial<MapPointData>),
      }),
    ).rejects.toThrow();
    expect(await countOf('svyaz-sobytie')).toBe(0);
  });

  it.each(['number', 'name', 'x', 'y'] as const)('без поля %s точка не сохраняется', async (field) => {
    const slug = `bez-${field}`;
    const data: Record<string, unknown> = { ...pointData(slug) };

    delete data[field];

    await expect(
      payload.create({ collection: 'map-points', data: data as unknown as MapPointData }),
    ).rejects.toMatchObject(rejectedAt(field));
    expect(await countOf(slug)).toBe(0);
  });

  it('две точки с одним номером и разными slug сохраняются, точка с занятым slug — нет', async () => {
    const first = await payload.create({ collection: 'map-points', data: pointData('yarmarka-1', { number: 8 }) });
    const second = await payload.create({ collection: 'map-points', data: pointData('yarmarka-2', { number: 8 }) });

    expect(first.number).toBe(8);
    expect(second.number).toBe(8);
    expect(second.id).not.toBe(first.id);

    await expect(
      payload.create({ collection: 'map-points', data: pointData('yarmarka-1', { number: 9, name: 'Двойник' }) }),
    ).rejects.toMatchObject(rejectedAt('slug'));
    expect(await countOf('yarmarka-1')).toBe(1);
  });

  it('аноним читает точки, а создать точку не может', async () => {
    const created = await payload.create({ collection: 'map-points', data: pointData('chtenie') });
    const { docs } = await payload.find({
      collection: 'map-points',
      overrideAccess: false,
      where: { slug: { equals: `${PREFIX}chtenie` } },
    });

    expect(docs.map((doc) => doc.id)).toEqual([created.id]);

    await expect(
      payload.create({ collection: 'map-points', overrideAccess: false, data: pointData('chuzhaya') }),
    ).rejects.toMatchObject({ name: 'Forbidden', status: 403 });
    expect(await countOf('chuzhaya')).toBe(0);
  });

  it('getHome отдает точки по номеру, равные номера — по id, связь читается', async () => {
    const ids: number[] = [];

    for (const [index, number] of [3, 1, 2, 1].entries()) {
      const link = index === 1 ? { link: { relationTo: 'zones' as const, value: zoneId } } : {};
      const created = await payload.create({
        collection: 'map-points',
        data: pointData(`glavnaya-${index}`, { number, ...link }),
      });

      ids.push(created.id);
    }

    const { mapPoints } = await getHome();
    const own = mapPoints.filter((point: MapPoint) => ids.includes(point.id));

    expect(own.map((point: MapPoint) => point.number)).toEqual([1, 1, 2, 3]);
    expect(own.map((point: MapPoint) => point.id)).toEqual([ids[1], ids[3], ids[2], ids[0]]);
    expect(mapPoints).toEqual(
      [...mapPoints].sort((left: MapPoint, right: MapPoint) => left.number - right.number || left.id - right.id),
    );

    const linked = own.find((point: MapPoint) => point.id === ids[1]);

    expect(linked?.link?.relationTo).toBe('zones');
    expect(relatedId(linked?.link?.value)).toBe(zoneId);
  });
});

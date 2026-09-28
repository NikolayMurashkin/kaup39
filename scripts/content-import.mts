import path from 'node:path';
import type { CollectionSlug, Payload, Where } from 'payload';
import { EVENT_FACTS, SCHEDULE_FACTS } from '../src/cms/facts';
import type { ContentFile, ContentSection, PhotoRegistry } from './content-types';
import { mediaData } from './media-data.mts';

/** День без времени хранится полднем UTC: в любом часовом поясе от −12 до +11 это тот же день. */
const dayOnly = (date: string) => `${date}T12:00:00.000Z`;

/** Коллекции, которые пишет импорт, — по ним он и отчитывается. */
export const IMPORTED_COLLECTIONS = ['media', 'events', 'schedule', 'zones', 'taverns', 'pages'] as const;

/**
 * Запись файла контента в CMS: фотографии загружаются из `photosDir`, цены, даты и кассы берутся из `src/cms/facts.ts`.
 * Записи ищутся по естественному ключу (slug, имя файла, событие + день + начало) и обновляются, поэтому повторный
 * запуск не плодит дублей; то, что поправили в админке, он перезапишет. Страница пишется целиком: раздел, который
 * в файле переехал на другую страницу, со старой пропадает. Проверку файла делает вызывающий — до записи.
 */
export const importContent = async (
  payload: Payload,
  content: ContentFile,
  registry: PhotoRegistry,
  photosDir: string,
) => {
  const existingId = async (collection: CollectionSlug, where: Where) => {
    const { docs } = await payload.find({ collection, where, limit: 1, depth: 0 });

    return docs[0]?.id as number | undefined;
  };

  const photoIds = new Map<string, number>();

  for (const item of content.media) {
    const { file } = item;
    const data = mediaData(item, registry);
    const { docs } = await payload.find({ collection: 'media', where: { filename: { equals: file } }, limit: 1 });
    const photo = docs[0]
      ? await payload.update({ collection: 'media', id: docs[0].id, data })
      : await payload.create({ collection: 'media', data, filePath: path.join(photosDir, file) });

    photoIds.set(file, photo.id);
  }

  const photo = (file: string | undefined) => (file ? photoIds.get(file) : undefined);
  const photos = (files: string[] | undefined) => (files ?? []).map((file) => photoIds.get(file)!);
  const items = (texts: string[] | undefined) => (texts ?? []).map((text) => ({ text }));

  const eventIds = new Map<string, number>();

  for (const {
    slug,
    title,
    ageRating,
    summary,
    description,
    venue,
    includes,
    extras,
    gallery,
    ...event
  } of content.events) {
    const { ticketUrl, tariffs } = EVENT_FACTS.find((fact) => fact.slug === slug)!;
    const id = await existingId('events', { slug: { equals: slug } });
    const data = {
      slug,
      title,
      ageRating,
      summary,
      description,
      venue,
      tariffs,
      ticketUrl,
      includes: items(includes),
      extras: items(extras),
      photo: photo(event.photo),
      gallery: photos(gallery),
    };
    const saved = id
      ? await payload.update({ collection: 'events', id, data })
      : await payload.create({ collection: 'events', data });

    eventIds.set(slug, saved.id);
  }

  for (const { event, date, start, end, show } of SCHEDULE_FACTS) {
    const eventId = eventIds.get(event)!;
    const data = { event: eventId, date: dayOnly(date), start, end, show };
    const id = await existingId('schedule', {
      and: [{ event: { equals: eventId } }, { date: { equals: data.date } }, { start: { equals: start } }],
    });

    await (id
      ? payload.update({ collection: 'schedule', id, data })
      : payload.create({ collection: 'schedule', data }));
  }

  for (const { slug, name, mark, description, order, ...zone } of content.zones) {
    const data = { slug, name, mark, description, order, photo: photo(zone.photo) };
    const id = await existingId('zones', { slug: { equals: slug } });

    await (id ? payload.update({ collection: 'zones', id, data }) : payload.create({ collection: 'zones', data }));
  }

  for (const { slug, name, description, order, menu, ...tavern } of content.taverns) {
    const data = { slug, name, description, order, menu, photo: photo(tavern.photo) };
    const id = await existingId('taverns', { slug: { equals: slug } });

    await (id ? payload.update({ collection: 'taverns', id, data }) : payload.create({ collection: 'taverns', data }));
  }

  const section = (source: ContentSection) => {
    if (source.blockType === 'photos') return { ...source, photos: photos(source.photos) };
    if (source.blockType === 'text') return { ...source, photo: photo(source.photo) };

    return source;
  };

  for (const { slug, title, lead, hero, teaser, sections } of content.pages) {
    const data = {
      slug,
      title,
      lead,
      hero: { photoNight: photo(hero?.photoNight), photoDay: photo(hero?.photoDay) },
      teaser: { ...teaser, photo: photo(teaser?.photo) },
      sections: sections.map(section),
    };
    const id = await existingId('pages', { slug: { equals: slug } });

    await (id ? payload.update({ collection: 'pages', id, data }) : payload.create({ collection: 'pages', data }));
  }

  const { refund, ...site } = content.site;

  await payload.updateGlobal({
    slug: 'site',
    data: { ...site, refund: { ...refund, details: items(refund.details) } },
  });

  const counts = await Promise.all(
    IMPORTED_COLLECTIONS.map(async (collection) => [collection, (await payload.count({ collection })).totalDocs]),
  );

  return Object.fromEntries(counts) as Record<(typeof IMPORTED_COLLECTIONS)[number], number>;
};

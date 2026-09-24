import config from '@payload-config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getPayload, type CollectionSlug, type Where } from 'payload';
import { MEDIA_DIR, TICKET_HOST } from '../src/cms/consts';
import { EVENT_FACTS, SCHEDULE_FACTS } from '../src/cms/facts';
import { contentProblems } from './content-check.mts';
import type { ContentFile, ContentSection, MediaManifestEntry } from './content-types';

/**
 * Перенос контента пяти страниц в CMS: `yarn import:content`. Тексты читаются из файла контента вне git,
 * фотографии — из выгрузки исходного сайта, цены, даты и кассы — из `src/cms/facts.ts`. Записи ищутся
 * по естественному ключу (slug, имя файла, событие + день + начало) и обновляются, поэтому повторный
 * запуск не плодит дублей; то, что поправили в админке, он перезапишет.
 */

const CONTENT_DIR = path.resolve('../research/kaup39/content');
const PHOTOS_DIR = path.resolve('../research/kaup39/media');

const readJson = <T>(file: string) => JSON.parse(readFileSync(file, 'utf8')) as T;

/** День без времени хранится полднем UTC: в любом часовом поясе от −12 до +11 это тот же день. */
const dayOnly = (date: string) => `${date}T12:00:00.000Z`;

const content = readJson<ContentFile>(path.join(CONTENT_DIR, 'content.json'));
const manifest = readJson<MediaManifestEntry[]>(path.join(PHOTOS_DIR, 'manifest.json'));
const problems = contentProblems(
  content,
  manifest,
  EVENT_FACTS.map((fact) => fact.slug),
);

if (problems.length > 0) {
  console.error(`Файл контента не прошел проверку, импорт не запускался:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

const payload = await getPayload({ config });

const existingId = async (collection: CollectionSlug, where: Where) => {
  const { docs } = await payload.find({ collection, where, limit: 1, depth: 0 });

  return docs[0]?.id as number | undefined;
};

const photoIds = new Map<string, number>();

for (const { file, alt, caption } of content.media) {
  const { docs } = await payload.find({ collection: 'media', where: { filename: { equals: file } }, limit: 1 });
  const photo = docs[0]
    ? await payload.update({ collection: 'media', id: docs[0].id, data: { alt, caption } })
    : await payload.create({ collection: 'media', data: { alt, caption }, filePath: path.join(PHOTOS_DIR, file) });

  photoIds.set(file, photo.id);
}

const photo = (file: string | undefined) => (file ? photoIds.get(file) : undefined);
const photos = (files: string[] | undefined) => (files ?? []).map((file) => photoIds.get(file)!);
const items = (texts: string[] | undefined) => (texts ?? []).map((text) => ({ text }));

const eventIds = new Map<string, number>();

for (const { slug, title, ageRating, summary, description, venue, includes, extras, gallery } of content.events) {
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
    gallery: photos(gallery),
  };
  const event = id
    ? await payload.update({ collection: 'events', id, data })
    : await payload.create({ collection: 'events', data });

  eventIds.set(slug, event.id);
}

for (const { event, date, start, end, show } of SCHEDULE_FACTS) {
  const eventId = eventIds.get(event)!;
  const data = { event: eventId, date: dayOnly(date), start, end, show };
  const id = await existingId('schedule', {
    and: [{ event: { equals: eventId } }, { date: { equals: data.date } }, { start: { equals: start } }],
  });

  await (id ? payload.update({ collection: 'schedule', id, data }) : payload.create({ collection: 'schedule', data }));
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

for (const { slug, title, lead, hero, sections } of content.pages) {
  const data = {
    slug,
    title,
    lead,
    hero: { photoNight: photo(hero?.photoNight), photoDay: photo(hero?.photoDay) },
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

const { docs: events } = await payload.find({ collection: 'events', pagination: false, depth: 0 });
const foreignTickets = events.filter((event) => new URL(event.ticketUrl).hostname !== TICKET_HOST);
const counts = await Promise.all(
  (['media', 'events', 'schedule', 'zones', 'taverns', 'pages'] as const).map(
    async (collection) => `${collection} ${(await payload.count({ collection })).totalDocs}`,
  ),
);

console.log(`Импорт завершен: ${counts.join(', ')}; фотографии — в ${MEDIA_DIR}/.`);
console.log(
  foreignTickets.length === 0
    ? `Ссылки на кассу у всех ${events.length} событий ведут на ${TICKET_HOST}.`
    : `Ссылки мимо ${TICKET_HOST}: ${foreignTickets.map((event) => event.slug).join(', ')}`,
);

await payload.destroy();

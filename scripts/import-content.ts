import config from '@payload-config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getPayload } from 'payload';
import { MEDIA_DIR, TICKET_HOST } from '../src/cms/consts';
import { EVENT_FACTS } from '../src/cms/facts';
import { contentProblems } from './content-check.mts';
import { importContent } from './content-import.mts';
import type { ContentFile, PhotoRegistry } from './content-types';

/**
 * Перенос контента шести страниц в CMS: `yarn import:content`. Тексты читаются из файла контента вне git,
 * фотографии — из `../research/kaup39/media/`, у каждой строка в реестре происхождения `photos.json` рядом
 * с контентом (D31). Запись — `importContent`: повторный запуск не плодит дублей.
 */

const CONTENT_DIR = path.resolve('../research/kaup39/content');
const PHOTOS_DIR = path.resolve('../research/kaup39/media');

const readJson = <T>(file: string) => JSON.parse(readFileSync(file, 'utf8')) as T;

const content = readJson<ContentFile>(path.join(CONTENT_DIR, 'content.json'));
const registry = readJson<PhotoRegistry>(path.join(CONTENT_DIR, 'photos.json'));
const problems = contentProblems(
  content,
  registry,
  EVENT_FACTS.map((fact) => fact.slug),
);

if (problems.length > 0) {
  console.error(`Файл контента не прошел проверку, импорт не запускался:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

const payload = await getPayload({ config });
const counts = await importContent(payload, content, registry, PHOTOS_DIR);

const { docs: events } = await payload.find({ collection: 'events', pagination: false, depth: 0 });
const foreignTickets = events.filter((event) => new URL(event.ticketUrl).hostname !== TICKET_HOST);

console.log(
  `Импорт завершен: ${Object.entries(counts)
    .map(([collection, count]) => `${collection} ${count}`)
    .join(', ')}; фотографии — в ${MEDIA_DIR}/.`,
);
console.log(
  foreignTickets.length === 0
    ? `Ссылки на кассу у всех ${events.length} событий ведут на ${TICKET_HOST}.`
    : `Ссылки мимо ${TICKET_HOST}: ${foreignTickets.map((event) => event.slug).join(', ')}`,
);

await payload.destroy();

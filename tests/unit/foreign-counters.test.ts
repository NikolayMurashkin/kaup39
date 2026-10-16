import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentProblems } from '../../scripts/content-check.mts';
import type { ContentFile, PhotoRegistry } from '../../scripts/content-types';

/** Счетчики исходного сайта: Метрика и VK top владельцев на демо не переносятся. */
const MARKERS = ['mc.yandex.ru', 'top-fwz1.mail.ru', '93702550', '3754437'];

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** Текстовые файлы: картинки, шрифты и видео идут мимо по расширению. */
const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.js',
  '.mjs',
  '.scss',
  '.css',
  '.json',
  '.svg',
  '.html',
  '.md',
  '.txt',
]);

const textFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);

    if (entry.isDirectory()) return textFiles(full);

    return TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) ? [full] : [];
  });

/** Рабочая копия контента лежит в плановой части студии и в git не входит: на CI ее нет. */
const CONTENT_JSON = fileURLToPath(new URL('../../../research/kaup39/content/content.json', import.meta.url));

/** Проверочный файл контента: тексты придуманы для теста и владельцам не принадлежат. */
const content = (body: string): ContentFile => ({
  site: {
    name: 'Проверочное поселение',
    address: 'Проверочный адрес',
    phone: '8 (000) 00-00-00',
    email: 'test@example.com',
    socials: [],
    refund: { title: 'Возврат', body: 'Условия возврата.', email: 'refund@example.com', details: ['Номер заказа'] },
  },
  media: [{ file: 'owner-photo.jpg', alt: 'Проверочный кадр' }],
  events: [{ slug: 'proverka', title: 'Проверочное событие', description: 'Проверочное описание.' }],
  zones: [],
  taverns: [],
  pages: [
    {
      slug: 'home',
      title: 'Главная',
      hero: { photoNight: 'owner-photo.jpg' },
      sections: [
        { blockType: 'photos', photos: ['owner-photo.jpg'] },
        { blockType: 'text', heading: 'Проверочный раздел', body },
      ],
    },
  ],
});

const registry: PhotoRegistry = {
  photos: [
    {
      file: 'owner-photo.jpg',
      source: 'https://kaup39.ru/proverka',
      author: 'Проверочный фотограф',
      basis: 'owners',
      subject: 'Проверочная площадка',
      slots: ['hero-night'],
    },
  ],
  noPhoto: [],
  noBetterPhoto: [],
};

const counterProblems = (body: string) =>
  contentProblems(content(body), registry, ['proverka']).filter((problem) => problem.includes('счетчик'));

describe('чужие счетчики не переносятся', () => {
  it('в src/ и public/ нет адресов и номеров счетчиков владельцев', () => {
    const files = ['src', 'public'].flatMap((directory) => textFiles(path.join(ROOT, directory)));
    const found = files.flatMap((file) => {
      const text = readFileSync(file, 'utf8');

      return MARKERS.filter((marker) => text.includes(marker)).map(
        (marker) => `${path.relative(ROOT, file)}: ${marker}`,
      );
    });

    expect(files.length).toBeGreaterThan(0);
    expect(found, found.join('\n')).toEqual([]);
  });

  it.each([
    '<script src="https://mc.yandex.ru/metrika/tag.js">',
    '//top-fwz1.mail.ru/js/code.js',
    'ym(93702550, "init")',
    '_tmr.push({id: "3754437"})',
  ])('проверка контента ловит счетчик в тексте раздела: %s', (marker) => {
    const problems = contentProblems(content(`Проверочный текст. ${marker}`), registry, ['proverka']);

    expect(problems).toContainEqual(expect.stringMatching(/^pages\[0\]\.sections\[1\]\.body: .*счетчик/));
  });

  it('проверка контента не путает со счетчиком телефон и цену с похожими цифрами', () => {
    expect(counterProblems('Звоните 8 (4012) 93-70-25, место от 3754 ₽.')).toEqual([]);
    // номер счетчика внутри более длинного числа — не счетчик
    expect(counterProblems('Заказ 937025501, договор 37544370.')).toEqual([]);
  });

  it.skipIf(!existsSync(CONTENT_JSON))('в рабочей копии контента нет адресов и номеров счетчиков', () => {
    const text = readFileSync(CONTENT_JSON, 'utf8');

    expect(MARKERS.filter((marker) => text.includes(marker))).toEqual([]);
  });
});

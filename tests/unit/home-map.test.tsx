import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FALLBACK_HEADINGS } from '@/app/(site)/_home/consts';
import { Kitchen } from '@/app/(site)/_home/Kitchen';
import { SettlementMap } from '@/app/(site)/_home/SettlementMap';
import { Zones } from '@/app/(site)/_home/Zones';
import { HOME_ANCHORS } from '@/cms/consts';
import { TEMPORARY_PHOTO_NOTE } from '@/components/PhotoNote/consts';
import { formatAmount } from '@/lib/format';
import type { MapPoint, Tavern } from '@/payload-types';
import { fileOf, media, zone, type Zone } from '../lib/albums';
import { dialogsOf, imagesOf, showsFile, SLIDER, sliderPart, textOf, type Dialog } from '../lib/markup';
import { readScssRules } from '../lib/scss';

const STAMP = '2026-10-07T00:00:00.000Z';

const SCSS_PATH = fileURLToPath(
  new URL('../../src/app/(site)/_home/SettlementMap/SettlementMap.module.scss', import.meta.url),
);

const PHONE = '@media (max-width: 640px)';
const TABLET = '@media (max-width: 1279px)';

/** Точка карты: координаты в процентах от рисунка; тексты придуманы для теста. */
const point = (id: number, number: number, name: string, extra: Partial<MapPoint> = {}): MapPoint => ({
  id,
  number,
  name,
  slug: `tochka-${id}`,
  x: 10 + id,
  y: 20 + id,
  updatedAt: STAMP,
  createdAt: STAMP,
  ...extra,
});

const tavern = (id: number, name: string, extra: Partial<Tavern> = {}): Tavern => ({
  id,
  name,
  slug: `taverna-${id}`,
  description: 'Описание проверочной таверны.',
  order: id,
  updatedAt: STAMP,
  createdAt: STAMP,
  ...extra,
});

const map = (points: MapPoint[], { zones = [], taverns = [] }: { zones?: Zone[]; taverns?: Tavern[] } = {}) =>
  renderToStaticMarkup(
    <SettlementMap
      anchor="map"
      heading="Карта поселения"
      points={points}
      zones={zones}
      taverns={taverns}
    />,
  );

const attribute = (tag: string, name: string) => tag.match(new RegExp(` ${name}="([^"]*)"`))?.[1] ?? null;

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

type Trigger = {
  /** Место открывающего тега кнопки в разметке. */
  index: number;
  /** Имя кнопки для скринридера: `aria-label` или текст. */
  name: string;
  text: string;
  dialog: Dialog;
};

/** Кнопки, открывающие диалог, с диалогом сразу за кнопкой и местом в разметке. */
const triggersOf = (markup: string): Trigger[] =>
  [
    ...markup.matchAll(
      /(<button\b[^>]*aria-haspopup="dialog"[^>]*>)((?:(?!<\/button>).)*)<\/button>\s*(?:<\/\w+>\s*)*<dialog\b([^>]*)>(.*?)<\/dialog>/gs,
    ),
  ].map(({ index, 1: tag, 2: content, 3: attributes, 4: html }) => {
    const text = squash(textOf(content));

    return {
      index,
      name: attribute(tag, 'aria-label') ?? text,
      text,
      dialog: { label: attribute(` ${attributes}`, 'aria-label') ?? '', html },
    };
  });

/** Начало списка под картой: последний `<ol>` вне диалогов (точки на самой карте могут стоять своим списком раньше). */
const listStart = (markup: string) =>
  markup.replace(/<dialog\b.*?<\/dialog>/gs, (dialog) => ' '.repeat(dialog.length)).lastIndexOf('<ol');

/** Кнопки на рисунке карты — до списка, строки списка — после его начала. */
const partsOf = (markup: string) => {
  const start = listStart(markup);
  const triggers = triggersOf(markup);

  return {
    start,
    dots: triggers.filter(({ index }) => start < 0 || index < start),
    rows: triggers.filter(({ index }) => start >= 0 && index > start),
  };
};

const dotOf = (markup: string, name: string) => partsOf(markup).dots.find((dot) => dot.name.includes(name));

const THREE = [media(11), media(12), media(13)];

describe('карта поселения: диалоги точек', () => {
  it('точка, связанная с площадкой, открывает тот же диалог, что карточка площадки, со слайдером кадров', () => {
    const linked = zone(1, 'Дом ярла', { photo: media(2), gallery: THREE });
    const other = zone(2, 'Кузня', { photo: media(3) });
    const [card] = dialogsOf(
      renderToStaticMarkup(
        <Zones
          anchor="zones"
          heading="Площадки"
          zones={[linked]}
        />,
      ),
    );
    const markup = map([point(1, 5, 'Длинный дом', { link: { relationTo: 'zones', value: linked } })], {
      zones: [other, linked],
    });
    const dot = dotOf(markup, 'Длинный дом');

    expect(card).toBeDefined();
    expect(dot).toBeDefined();
    expect(dot?.dialog.label).toBe(card.label);
    expect(textOf(dot?.dialog.html ?? '')).toBe(textOf(card.html));
    expect(textOf(dot?.dialog.html ?? '')).toContain('Даты и цены');

    const slider = sliderPart(dot?.dialog.html ?? '');

    expect(slider).toContain(SLIDER);
    expect(imagesOf(slider).map(({ src }) => src)).toEqual(imagesOf(sliderPart(card.html)).map(({ src }) => src));
    expect(showsFile(imagesOf(slider)[0], fileOf(11))).toBe(true);
    expect(textOf(slider)).toContain('1 из 3');
  });

  it('точка, связанная с таверной, открывает тот же диалог, что таверна в кухне, с меню и ценами', () => {
    const linked = tavern(5, 'Таверна викингов', {
      photo: media(4),
      menu: [
        {
          title: 'Горячее',
          items: [
            { name: 'Похлебка', price: 350 },
            { name: 'Каша', price: 200, priceTo: 300 },
          ],
        },
      ],
    });
    const [card] = dialogsOf(
      renderToStaticMarkup(
        <Kitchen
          anchor="kitchen"
          heading="Кухня"
          photo={null}
          taverns={[linked]}
        />,
      ),
    );
    const markup = map([point(2, 9, 'Корчма', { link: { relationTo: 'taverns', value: linked.id } })], {
      taverns: [tavern(6, 'Пекарня'), linked],
    });
    const dot = dotOf(markup, 'Корчма');
    const text = textOf(dot?.dialog.html ?? '');

    expect(card).toBeDefined();
    expect(dot).toBeDefined();
    expect(dot?.dialog.label).toBe(card.label);
    expect(text).toBe(textOf(card.html));
    expect(text).toContain('Похлебка');
    expect(text).toContain(formatAmount(350));
    expect(text).toContain('Каша');
    expect(text).toContain(`${formatAmount(200)}–${formatAmount(300)}`);
  });

  it('точка без связи с кадром — диалог с названием и одним кадром точки, подпись автора и пометка временного кадра', () => {
    const markup = map([
      point(3, 12, 'Камень ярла', { photo: media(21, { author: 'Роман Большаков' }) }),
      point(4, 13, 'Старый колодец', { photo: media(22, { temporary: true }) }),
    ]);
    const authored = dotOf(markup, 'Камень ярла');
    const temporary = dotOf(markup, 'Старый колодец');

    expect(authored).toBeDefined();
    expect(temporary).toBeDefined();

    for (const [dot, id, name] of [
      [authored, 21, 'Камень ярла'],
      [temporary, 22, 'Старый колодец'],
    ] as const) {
      const html = dot?.dialog.html ?? '';
      const images = imagesOf(html);

      expect(textOf(html)).toContain(name);
      expect(images).toHaveLength(1);
      expect(showsFile(images[0], fileOf(id))).toBe(true);
      expect(html).not.toContain(SLIDER);
    }

    expect(textOf(authored?.dialog.html ?? '')).toContain('Фото: Роман Большаков');
    expect(textOf(temporary?.dialog.html ?? '')).toContain(TEMPORARY_PHOTO_NOTE);
    expect(textOf(temporary?.dialog.html ?? '')).not.toContain('Фото:');
  });

  it('точка без связи и без кадра — диалог с названием, без кадра', () => {
    const dot = dotOf(map([point(5, 14, 'Поляна костров')]), 'Поляна костров');

    expect(dot).toBeDefined();
    expect(textOf(dot?.dialog.html ?? '')).toContain('Поляна костров');
    expect(dot?.dialog.html).not.toContain('<img');
  });

  it('связь с площадкой, которой нет среди площадок, — диалог как у точки без связи: название и свой кадр', () => {
    const markup = map([point(6, 15, 'Старая кузня', { link: { relationTo: 'zones', value: 99 }, photo: media(31) })], {
      zones: [zone(1, 'Дом ярла', { photo: media(2), gallery: THREE })],
    });
    const dot = dotOf(markup, 'Старая кузня');
    const html = dot?.dialog.html ?? '';

    expect(dot).toBeDefined();
    expect(textOf(html)).toContain('Старая кузня');
    expect(imagesOf(html)).toHaveLength(1);
    expect(showsFile(imagesOf(html)[0], fileOf(31))).toBe(true);
    expect(html).not.toContain(SLIDER);
    expect(textOf(html)).not.toContain('Дом ярла');
  });

  it('связь с таверной, которой нет среди таверн, — диалог как у точки без связи: название, без меню чужой таверны', () => {
    const markup = map([point(16, 11, 'Старая корчма', { link: { relationTo: 'taverns', value: 99 } })], {
      taverns: [tavern(1, 'Корчма у ворот')],
    });
    const dot = dotOf(markup, 'Старая корчма');
    const html = dot?.dialog.html ?? '';

    expect(dot).toBeDefined();
    expect(textOf(html)).toContain('Старая корчма');
    expect(textOf(html)).not.toContain('Корчма у ворот');
  });
});

describe('карта поселения: список и точки на рисунке', () => {
  it('под рисунком список <ol> «номер — название» по номерам, каждая строка открывает диалог своей точки', () => {
    const points = [
      point(1, 3, 'Кузня', { photo: media(41) }),
      point(2, 8, 'Ярмарка ремесел'),
      point(3, 1, 'Дом ярла', { photo: media(43, { author: 'Роман Большаков' }) }),
      point(4, 8, 'Ярмарка мастеров', { photo: media(44) }),
    ];
    const markup = map(points);
    const { start, dots, rows } = partsOf(markup);
    const lastDot = Math.max(...dots.map(({ index }) => index));

    expect(dots).toHaveLength(4);
    expect(start).toBeGreaterThan(lastDot);
    expect(rows).toHaveLength(4);
    expect(markup.slice(start, rows[rows.length - 1].index)).not.toContain('</ol>');
    expect(rows.slice(0, 2).map(({ text }) => text)).toEqual(['1 — Дом ярла', '3 — Кузня']);
    expect(
      rows
        .slice(2)
        .map(({ text }) => text)
        .sort(),
    ).toEqual(['8 — Ярмарка мастеров', '8 — Ярмарка ремесел']);

    for (const { name } of points) {
      const row = rows.find(({ text }) => text.endsWith(`— ${name}`));
      const dot = dotOf(markup, name);

      expect(row).toBeDefined();
      expect(dot).toBeDefined();
      expect(textOf(row?.dialog.html ?? '')).toContain(name);
      expect(textOf(row?.dialog.html ?? '')).toBe(textOf(dot?.dialog.html ?? ''));
    }
  });

  it('кнопка точки стоит на рисунке по x и y в процентах, имя кнопки — номер и название', () => {
    const markup = map([point(7, 14, 'Причал', { x: 57.75, y: 35.46 }), point(8, 2, 'Ворота', { x: 12.5, y: 80 })]);
    const placed = [...markup.matchAll(/<\w+\b[^>]*\sstyle="([^"]*)"[^>]*>/g)].find(({ 1: style }) => {
      const declarations = Object.fromEntries(
        style.split(';').map((declaration) => declaration.split(':').map((part) => part.trim())),
      );

      return declarations.left === '57.75%' && declarations.top === '35.46%';
    });

    expect(placed).toBeDefined();

    const dot = partsOf(markup).dots.find(({ index }) => index >= (placed?.index ?? Infinity));

    expect(dot).toBeDefined();
    expect(dot?.name).toContain('14');
    expect(dot?.name).toContain('Причал');
    expect(dot?.name).not.toContain('Ворота');
  });

  it('метка — номер двумя цифрами: имена меток «02 — …» и «14 — …» по номерам', () => {
    const { dots } = partsOf(map([point(7, 14, 'Причал'), point(8, 2, 'Ворота')]));

    expect(dots.map(({ name }) => name)).toEqual(['02 — Ворота', '14 — Причал']);
    expect(dots.map(({ text }) => text)).toEqual(['02', '14']);
  });

  it('равные номера — по id, даже если на входе id идут по убыванию: и метки, и строки списка', () => {
    const { dots, rows } = partsOf(map([point(9, 8, 'Ярмарка поздняя'), point(4, 8, 'Ярмарка ранняя')]));

    expect(dots.map(({ name }) => name)).toEqual(['08 — Ярмарка ранняя', '08 — Ярмарка поздняя']);
    expect(rows.map(({ text }) => text)).toEqual(['8 — Ярмарка ранняя', '8 — Ярмарка поздняя']);
  });

  it('список виден на телефоне: в 640-правиле класс .list не скрыт, медиазапросы модуля — только 640 и 1279', () => {
    expect(existsSync(SCSS_PATH)).toBe(true);

    const rules = readScssRules(SCSS_PATH);
    const list = rules.filter(({ selector }) => /\.list(?![\w-])/.test(selector));
    const phone = list.filter(({ media }) => media === PHONE);
    const hiddenElsewhere = list.some(({ media, declarations }) => media !== PHONE && declarations.display === 'none');

    expect(list.length).toBeGreaterThan(0);
    expect(phone.filter(({ declarations }) => declarations.display === 'none')).toEqual([]);

    if (hiddenElsewhere) {
      expect(phone.some(({ declarations }) => declarations.display && declarations.display !== 'none')).toBe(true);
    }

    expect(rules.filter(({ media }) => media !== null && media !== PHONE && media !== TABLET)).toEqual([]);

    const markup = map([point(1, 1, 'Дом ярла'), point(2, 2, 'Кузня')]);
    const start = listStart(markup);
    const olTag = start < 0 ? '' : (markup.slice(start).match(/^<ol\b[^>]*>/)?.[0] ?? '');

    expect(attribute(olTag, 'class')?.split(' ')).toEqual(expect.arrayContaining([expect.stringMatching(/^_list_/)]));
  });

  it('точек нет — раздел не рисуется', () => {
    expect(map([])).toBe('');
  });

  it('якорь map, запасной заголовок «Карта поселения», заголовок и текст раздела — в рейке', () => {
    expect(HOME_ANCHORS).toHaveProperty('map', 'map');
    expect(FALLBACK_HEADINGS).toHaveProperty('map', 'Карта поселения');

    const markup = renderToStaticMarkup(
      <SettlementMap
        anchor="map"
        heading="Поселение сверху"
        body={'Первый абзац о карте.\n\nВторой абзац о карте.'}
        points={[point(1, 1, 'Дом ярла')]}
        zones={[]}
        taverns={[]}
      />,
    );
    const title = markup.match(/<h2\b[^>]*\sid="map-title"[^>]*>(.*?)<\/h2>/s)?.[1];
    const paragraphs = [...markup.replace(/<dialog\b.*?<\/dialog>/gs, '').matchAll(/<p\b[^>]*>(.*?)<\/p>/gs)].map(
      ({ 1: html }) => squash(textOf(html)),
    );

    expect(title === undefined ? undefined : squash(textOf(title))).toBe('Поселение сверху');
    expect(paragraphs).toEqual(expect.arrayContaining(['Первый абзац о карте.', 'Второй абзац о карте.']));
  });
});

type Element = {
  name: string;
  /** Открывающий тег целиком. */
  tag: string;
  /** Место открывающего тега в разметке. */
  index: number;
  /** Разметка между открывающим и закрывающим тегом. */
  inner: string;
  /** Объемлющие элементы, от внешнего к ближайшему. */
  ancestors: Element[];
};

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'wbr',
]);

/** Элементы разметки с вложенностью: у каждого — его внутренняя разметка и объемлющие элементы. */
const elementsOf = (markup: string): Element[] => {
  const elements: Element[] = [];
  const open: { element: Element; contentStart: number }[] = [];

  for (const { index, 0: tag, 1: closing, 2: rawName, 3: selfClosing } of markup.matchAll(
    /<(\/?)([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g,
  )) {
    const name = rawName.toLowerCase();

    if (closing) {
      const at = open.map(({ element }) => element.name).lastIndexOf(name);

      if (at < 0) continue;

      for (const { element, contentStart } of open.splice(at)) element.inner = markup.slice(contentStart, index);

      continue;
    }

    const element: Element = { name, tag, index, inner: '', ancestors: open.map(({ element }) => element) };

    elements.push(element);

    if (!selfClosing && !VOID_TAGS.has(name)) open.push({ element, contentStart: index + tag.length });
  }

  return elements;
};

/** Рисунок карты: разметка до списка, диалоги заменены пробелами — места тегов те же, что в разметке целиком. */
const drawingOf = (markup: string) => {
  const blanked = markup.replace(/<dialog\b.*?<\/dialog>/gs, (dialog) => ' '.repeat(dialog.length));
  const start = listStart(markup);

  return elementsOf(start < 0 ? blanked : blanked.slice(0, start));
};

/** Метки рисунка: элементы с `aria-hidden="true"` и текстом, без такой же метки внутри; пустой слой рисунка — не метка. */
const labelsOf = (markup: string) => {
  const candidates = drawingOf(markup).filter(
    ({ tag, inner }) => attribute(tag, 'aria-hidden') === 'true' && textOf(inner).trim() !== '',
  );

  return candidates.filter((label) => !candidates.some(({ ancestors }) => ancestors.includes(label)));
};

const labelText = ({ inner }: Element) => textOf(inner).trim();

const styleOf = (tag: string): Record<string, string> =>
  Object.fromEntries(
    (attribute(tag, 'style') ?? '')
      .split(';')
      .filter((declaration) => declaration.includes(':'))
      .map((declaration) => {
        const colon = declaration.indexOf(':');

        return [declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim()];
      }),
  );

/** Положение элемента на рисунке: `left` и `top` его `style` или ближайшего объемлющего элемента с ними. */
const placeOf = (element: Element | undefined) => {
  if (!element) return undefined;

  const placed = [element, ...[...element.ancestors].reverse()].find(({ tag }) => {
    const style = styleOf(tag);

    return 'left' in style || 'top' in style;
  });
  const style = placed ? styleOf(placed.tag) : {};

  return { left: style.left, top: style.top };
};

/** Кнопка точки на рисунке с именем «NN — название» как элемент разметки. */
const dotElement = (markup: string, name: string) => {
  const dot = partsOf(markup).dots.find((trigger) => trigger.name === name);

  return dot ? drawingOf(markup).find(({ index }) => index === dot.index) : undefined;
};

/** Имена классов CSS-модуля из тега: `_dot_1a2b3` → `dot`. */
const moduleClasses = (tag: string) =>
  (attribute(tag, 'class') ?? '').split(' ').flatMap((value) => value.match(/^_([A-Za-z0-9-]+)_/)?.[1] ?? []);

const tagAt = (markup: string, index: number) => markup.slice(index).match(/^<\w+\b[^>]*>/)?.[0] ?? '';

/** Правила модуля, у которых последняя часть хотя бы одного селектора — с классом `name`. */
const rulesOfClass = (rules: ReturnType<typeof readScssRules>, name: string) => {
  const own = new RegExp(`\\.${name}(?![\\w-])`);

  return rules.filter(({ selector }) =>
    selector.split(',').some((part) =>
      own.test(
        part
          .trim()
          .split(/[\s>+~]+/)
          .pop() ?? '',
      ),
    ),
  );
};

const PLACED = [
  point(7, 14, 'Причал', { x: 57.75, y: 35.46 }),
  point(8, 2, 'Ворота', { x: 12.5, y: 80 }),
  point(9, 5, 'Кузня', { x: 40, y: 41 }),
];

describe('карта поселения: метки рисунка на телефоне', () => {
  it('у каждой точки рисунка — метка с номером двумя цифрами', () => {
    const labels = labelsOf(map(PLACED));

    expect(labels).toHaveLength(3);
    expect(labels.map(labelText)).toEqual(['02', '05', '14']);
  });

  it('метка не нажимается и не берет фокус', () => {
    const labels = labelsOf(map(PLACED));

    expect(labels).toHaveLength(3);

    for (const { name, tag, inner } of labels) {
      expect(name).not.toBe('button');
      expect(name).not.toBe('a');
      expect(attribute(tag, 'aria-hidden')).toBe('true');
      expect(attribute(tag, 'tabindex')).toBeNull();
      expect(attribute(tag, 'role')).toBeNull();
      expect(attribute(tag, 'aria-haspopup')).toBeNull();
      expect(tag).not.toMatch(/\son\w+=/i);
      expect(inner).not.toMatch(/<button\b/);
      expect(inner).not.toMatch(/<a[\s>]/);
      expect(inner).not.toMatch(/<input\b/);
      expect(inner).not.toMatch(/<select\b/);
      expect(inner).not.toMatch(/<textarea\b/);
      expect(inner).not.toMatch(/tabindex=/);
    }
  });

  it('метка стоит там же, где кнопка точки', () => {
    const markup = map(PLACED);
    const labels = labelsOf(markup);

    for (const [text, name, left, top] of [
      ['02', '02 — Ворота', '12.5%', '80%'],
      ['05', '05 — Кузня', '40%', '41%'],
      ['14', '14 — Причал', '57.75%', '35.46%'],
    ] as const) {
      const label = labels.filter((candidate) => labelText(candidate) === text);

      expect(label).toHaveLength(1);
      expect(placeOf(label[0])).toEqual({ left, top });
      expect(placeOf(dotElement(markup, name))).toEqual({ left, top });
    }
  });

  it('кнопок точек на рисунке столько же, сколько точек; диалогов не прибавилось', () => {
    const markup = map(PLACED);
    const { dots, rows } = partsOf(markup);

    expect(labelsOf(markup)).toHaveLength(3);
    expect(dots.map(({ name }) => name)).toEqual(['02 — Ворота', '05 — Кузня', '14 — Причал']);
    expect(rows).toHaveLength(3);
    expect(markup.match(/<dialog\b/g) ?? []).toHaveLength(6);
  });

  it('равные номера и соседи — у каждой точки своя метка', () => {
    const labels = labelsOf(
      map([
        point(4, 8, 'Ярмарка ранняя'),
        point(9, 8, 'Ярмарка поздняя'),
        point(5, 6, 'Мост', { x: 30, y: 30 }),
        point(6, 5, 'Брод', { x: 30.5, y: 30.4 }),
      ]),
    );

    expect(labels).toHaveLength(4);
    expect(labels.map(labelText)).toEqual(['05', '06', '08', '08']);
    expect(placeOf(labels[0])).toEqual({ left: '30.5%', top: '30.4%' });
    expect(placeOf(labels[1])).toEqual({ left: '30%', top: '30%' });
  });

  /** Классы метки и кнопки точки — из разметки: тест не знает, как их назовет модуль. */
  const classesOfMap = () => {
    const markup = map([point(1, 1, 'Дом ярла'), point(2, 2, 'Кузня')]);
    const { dots, rows } = partsOf(markup);
    const rowClasses = new Set(rows.flatMap(({ index }) => moduleClasses(tagAt(markup, index))));
    const [label] = labelsOf(markup);

    return {
      label: label ? moduleClasses(label.tag)[0] : undefined,
      dot: dots.length ? moduleClasses(tagAt(markup, dots[0].index)).find((name) => !rowClasses.has(name)) : undefined,
    };
  };

  it('на телефоне кнопки точек спрятаны; медиазапросы модуля — по-прежнему только 640 и 1279', () => {
    const { dot } = classesOfMap();

    expect(dot).toBeDefined();

    const rules = readScssRules(SCSS_PATH);
    const dotRules = rulesOfClass(rules, dot ?? '');

    expect(dotRules.some(({ media, declarations }) => media === PHONE && declarations.display === 'none')).toBe(true);
    expect(rules.filter(({ media }) => media !== null && media !== PHONE && media !== TABLET)).toEqual([]);
    expect(
      readFileSync(SCSS_PATH, 'utf8').match(/@media[^{]*(?:min-width|hover|pointer|prefers-)[^{]*/g) ?? [],
    ).toEqual([]);
  });

  it('на телефоне метки видны', () => {
    const { label } = classesOfMap();

    expect(label).toBeDefined();

    const phone = rulesOfClass(readScssRules(SCSS_PATH), label ?? '').filter(({ media }) => media === PHONE);

    expect(phone.some(({ declarations }) => declarations.display && declarations.display !== 'none')).toBe(true);
    expect(phone.filter(({ declarations }) => declarations.display === 'none')).toEqual([]);
  });

  it('вне 640-правила метки скрыты, кнопки — нет', () => {
    const { label, dot } = classesOfMap();

    expect(label).toBeDefined();
    expect(dot).toBeDefined();

    const rules = readScssRules(SCSS_PATH);
    const labelRules = rulesOfClass(rules, label ?? '');
    const dotRules = rulesOfClass(rules, dot ?? '');

    expect(labelRules.some(({ media, declarations }) => media === null && declarations.display === 'none')).toBe(true);
    expect(
      labelRules.filter(
        ({ media, declarations }) => media === TABLET && declarations.display && declarations.display !== 'none',
      ),
    ).toEqual([]);
    expect(
      dotRules.filter(
        ({ media, declarations }) => (media === null || media === TABLET) && declarations.display === 'none',
      ),
    ).toEqual([]);
  });
});

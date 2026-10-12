import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { eventCards } from '@/app/(site)/_home/cards';
import { EmptySchedule } from '@/app/(site)/_schedule/EmptySchedule';
import type { Event } from '@/payload-types';

const SITE = { phone: '8 (4012) 37-99-26', email: 'hello@kaup39.example' };

const event = (id: number, slug: string, title: string): Event => ({
  id,
  slug,
  title,
  ticketUrl: `https://radario.ru/customer/afisha/${slug}`,
  tariffs: [{ kind: 'entry', amount: 700 }],
  summary: `Коротко о событии ${title}`,
  includes: [{ text: 'Экскурсия' }, { text: 'Ярмарка' }],
  updatedAt: '2026-09-28T00:00:00.000Z',
  createdAt: '2026-09-28T00:00:00.000Z',
});

const EVENTS = [event(1, 'prazdnik', 'Праздник поселения'), event(2, 'ragnarek', 'Рагнарек')];

/** Сезон закрыт: будущих дат нет ни у кого, последний день сезона — 24 октября 2026. */
const CARDS = eventCards(EVENTS, [], '2026-10-24');

const count = (markup: string, part: string) => markup.split(part).length - 1;

describe('пустое расписание: сезон закрыт', () => {
  it('контакты, «сезон 2026 закрыт», «События сезона» и карточка на каждое событие без кассы', () => {
    const markup = renderToStaticMarkup(
      <EmptySchedule
        site={SITE}
        cards={CARDS}
      />,
    );

    expect(CARDS).toHaveLength(2);
    expect(markup).toContain('data-schedule-empty');
    expect(markup).toContain('href="tel:+74012379926"');
    expect(markup).toContain(`href="mailto:${SITE.email}"`);
    expect(markup).toContain('сезон 2026 закрыт');
    expect(markup).toContain('События сезона');

    for (const { slug, title } of EVENTS) {
      expect(markup).toMatch(
        new RegExp(`<a[^>]*href="/sobytiya/${slug}"[^>]*>(?:(?!</a>)[\\s\\S])*${title}(?:(?!</a>)[\\s\\S])*</a>`),
      );
    }

    // подписи считаются внутри карточек: «дат пока нет» есть и в заголовке пустого состояния
    const cards = markup.match(/<article\b[\s\S]*?<\/article>/g) ?? [];

    expect(cards).toHaveLength(EVENTS.length);

    for (const card of cards) {
      expect(count(card, 'дат пока нет')).toBe(1);
      expect(count(card, 'цены прошлого сезона')).toBe(1);
    }
    expect(markup).not.toContain('Купить билет');
    expect(markup).not.toContain('radario.ru');
  });

  it('карточек нет — контакты на месте, заголовка «События сезона» и пустой сетки нет', () => {
    const markup = renderToStaticMarkup(
      <EmptySchedule
        site={SITE}
        cards={[]}
      />,
    );

    expect(markup).toContain('data-schedule-empty');
    expect(markup).toContain('href="tel:+74012379926"');
    expect(markup).toContain(`href="mailto:${SITE.email}"`);
    expect(markup).not.toContain('События сезона');
    expect(markup).not.toContain('data-event-card');
    expect(markup).not.toContain('<article');
  });
});

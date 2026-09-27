import { AppRouterContext, type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { SITE } from '../lib/site';

/** Шесть страниц демо (D30): у каждого пункта шапки своя страница, якорей нет. */
const PAGE_PATHS = [
  '/raspisanie',
  '/sobytiya/denvikingi',
  '/sobytiya/ragnarek',
  '/kak-doehat',
  '/kemping',
  '/korporativy',
];

const noop = () => undefined;

const ROUTER: AppRouterInstance = {
  back: noop,
  forward: noop,
  refresh: noop,
  push: noop,
  replace: noop,
  prefetch: noop,
  bfcacheId: 'test',
};

/** Переключатель темы в шапке зовет `useRouter`, поэтому шапка рисуется внутри контекста маршрутизатора. */
const render = (element: ReactElement) =>
  renderToStaticMarkup(<AppRouterContext.Provider value={ROUTER}>{element}</AppRouterContext.Provider>);

const hrefsOf = (markup: string) => [...markup.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map(([, href]) => href);

/** Ссылки внутри `<nav>` с этой подписью. */
const navHrefs = (markup: string, label: string) => {
  const start = new RegExp(`<nav\\b[^>]*aria-label="${label}"`).exec(markup)?.index ?? -1;

  expect(start, `нет навигации «${label}»`).toBeGreaterThanOrEqual(0);

  return hrefsOf(markup.slice(start, markup.indexOf('</nav>', start)));
};

describe('каркас v2: ссылки шапки и подвала', () => {
  const header = render(
    <SiteHeader
      site={SITE}
      theme="dark"
    />,
  );
  const footer = render(<SiteFooter site={SITE} />);

  it.each([
    ['шапка', header],
    ['подвал', footer],
  ])('%s: ни одна ссылка не ведет на якорь', (_, markup) => {
    const hrefs = hrefsOf(markup);

    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.filter((href) => href.includes('#'))).toEqual([]);
  });

  it('шесть ссылок шапки ведут на шесть разных адресов страниц', () => {
    expect(navHrefs(header, 'Разделы сайта')).toEqual(PAGE_PATHS);
  });

  it('подвал перечисляет те же шесть страниц', () => {
    expect(navHrefs(footer, 'Страницы')).toEqual(PAGE_PATHS);
  });
});

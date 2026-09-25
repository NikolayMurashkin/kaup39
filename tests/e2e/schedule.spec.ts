import { expect, test, type Locator, type Page } from '@playwright/test';
import { TARIFF_LABELS } from '../../src/cms/consts';
import { MONTHS_GENITIVE, WEEKDAYS } from '../../src/lib/consts';
import { formatAmount } from '../../src/lib/format';
import { SCHEDULE_PATH } from './consts';
import { EVENTS, scheduleOf, settlementToday, shiftDay } from './seed/data';

const ROW = '[data-schedule-row]';

const DATE_FORMAT = new RegExp(`^([1-9]|[12]\\d|3[01]) (${MONTHS_GENITIVE.join('|')}), (${WEEKDAYS.join('|')})$`);

const TIME_FORMAT = /^\d\d:\d\d — \d\d:\d\d(, шоу \d\d:\d\d)?$/;

/** Даты засева, которые еще не прошли: сегодняшних в засеве нет, поэтому хватает сравнения дней. */
const futureSchedule = () => {
  const today = settlementToday();

  return scheduleOf(today)
    .filter(({ date }) => date > today)
    .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
};

const rows = (page: Page) =>
  page.locator(ROW).evaluateAll((nodes) =>
    nodes.map((node) => ({
      date: node.querySelector('time[datetime]')?.getAttribute('datetime'),
      event: node.getAttribute('data-event'),
    })),
  );

/** Фильтр — ссылка: по клику страница загружается заново с параметрами в адресе. */
const follow = async (page: Page, link: Locator) => {
  const target = new URL((await link.getAttribute('href'))!, page.url());

  await link.click();
  await page.waitForURL((url) => url.pathname === target.pathname && url.search === target.search, {
    waitUntil: 'load',
  });
};

test.describe('расписание', () => {
  test('путь «главная → Расписание → Купить билет» проходится в два клика и ведет на radario.ru с идентификатором события', async ({
    page,
  }) => {
    // касса снаружи не открывается: тесту важно, куда ведет кнопка, а не страница Radario
    await page.route('https://radario.ru/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Radario</title>' }),
    );
    await page.goto('/');

    await page.locator(`header nav a[href="${SCHEDULE_PATH}"]`).first().click();
    await expect(page).toHaveURL(SCHEDULE_PATH);

    const row = page.locator(ROW).first();
    const slug = await row.getAttribute('data-event');
    const event = EVENTS.find((candidate) => candidate.slug === slug);

    expect(event, `у первой строки неизвестное событие ${slug}`).toBeDefined();

    await row.getByRole('link', { name: 'Купить билет' }).click();
    await expect(page).toHaveURL(event!.ticketUrl);
    expect(new URL(page.url()).hostname).toBe('radario.ru');
    expect(new URL(page.url()).pathname).toMatch(/^\/customer\/afisha\/[^/]+$/);
  });

  for (const [place, scope] of [
    ['шапки', 'header'],
    ['подвала', 'footer'],
    ['главной', 'main'],
  ]) {
    test(`на расписание ведет ссылка из ${place}, и по ней открывается страница расписания`, async ({ page }) => {
      await page.goto('/');

      const link = page.locator(`${scope} a[href="${SCHEDULE_PATH}"]`).filter({ visible: true }).first();
      const [response] = await Promise.all([
        page.waitForResponse((candidate) => new URL(candidate.url()).pathname === SCHEDULE_PATH),
        link.click(),
      ]);

      expect(response.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Расписание и цены');
    });
  }

  test('у каждой строки есть дата, время, событие, цена и кнопка билета; только будущие даты по порядку', async ({
    page,
  }) => {
    const future = futureSchedule();

    await page.goto(SCHEDULE_PATH);

    expect(await rows(page)).toEqual(future.map(({ date, event }) => ({ date, event })));

    for (const row of await page.locator(ROW).all()) {
      const slug = await row.getAttribute('data-event');
      const event = EVENTS.find((candidate) => candidate.slug === slug)!;
      const least = Math.min(...event.tariffs.map(({ amount }) => amount));
      const prefix = event.tariffs.some(({ amount }) => amount !== least) ? 'от ' : '';

      await expect(row.locator('time[datetime]')).toHaveText(DATE_FORMAT);
      await expect(row.locator('[data-row-part="time"]')).toHaveText(TIME_FORMAT);
      await expect(row.getByRole('heading', { level: 3 })).toHaveText(event.title);
      await expect(row.locator('[data-price]')).toContainText(`${prefix}${formatAmount(least)} ₽`);
      await expect(row.getByRole('link', { name: 'Купить билет' })).toHaveAttribute('href', event.ticketUrl);
    }
  });

  test('фильтр по месяцу и фильтр по событию оставляют только подходящие строки, «все» возвращает полный список', async ({
    page,
  }) => {
    const future = futureSchedule().map(({ date, event }) => ({ date, event }));
    const months = [...new Set(future.map(({ date }) => date.slice(0, 7)))];

    // сдвиги засева от 1 до 40 дней всегда задевают два месяца: фильтру есть что отсеивать
    expect(months.length).toBeGreaterThan(1);

    await page.goto(SCHEDULE_PATH);

    const monthFilter = page.locator('[data-filter="month"]');
    const eventFilter = page.locator('[data-filter="event"]');

    for (const month of months) {
      const link = monthFilter.locator(`a[data-value="${month}"]`);

      await follow(page, link);
      await expect(monthFilter.locator(`a[data-value="${month}"]`)).toHaveAttribute('aria-current', 'true');
      expect(await rows(page)).toEqual(future.filter(({ date }) => date.startsWith(month)));
    }

    await follow(page, monthFilter.getByRole('link', { name: 'Все' }));
    expect(await rows(page)).toEqual(future);

    for (const { slug } of EVENTS) {
      await follow(page, eventFilter.locator(`a[data-value="${slug}"]`));
      await expect(eventFilter.locator(`a[data-value="${slug}"]`)).toHaveAttribute('aria-current', 'true');
      expect(await rows(page)).toEqual(future.filter(({ event }) => event === slug));
    }

    // оба фильтра сразу: пересечение, а «все» у одного снимает только его
    await follow(page, monthFilter.locator(`a[data-value="${months[0]}"]`));
    expect(await rows(page)).toEqual(
      future.filter(({ date, event }) => date.startsWith(months[0]) && event === EVENTS.at(-1)!.slug),
    );

    await follow(page, eventFilter.getByRole('link', { name: 'Все' }));
    expect(await rows(page)).toEqual(future.filter(({ date }) => date.startsWith(months[0])));

    await follow(page, monthFilter.getByRole('link', { name: 'Все' }));
    expect(await rows(page)).toEqual(future);
  });

  test('ссылка с фильтром, по которому дат нет, — строка «по этому фильтру дат нет» и ссылка на все даты', async ({
    page,
  }) => {
    // прошедший месяц: так выглядит сохраненная ссылка с фильтром, когда месяц уже закончился, и среди вариантов
    // фильтра его нет никогда — будущие даты засева начинаются не раньше завтрашнего дня
    const past = shiftDay(settlementToday(), -40).slice(0, 7);

    await page.goto(`${SCHEDULE_PATH}?month=${past}`);
    await expect(page.locator(ROW)).toHaveCount(0);

    const nothing = page.locator('[data-schedule-nothing]');

    await expect(nothing).toBeVisible();
    await nothing.getByRole('link', { name: 'Показать все даты' }).click();
    await expect(page).toHaveURL(SCHEDULE_PATH);
    expect(await rows(page)).toEqual(futureSchedule().map(({ date, event }) => ({ date, event })));
  });

  test('таблица «Цены билетов»: у каждого события с будущими датами все виды билета словами админки и их цены', async ({
    page,
  }) => {
    const slugs = [...new Set(futureSchedule().map(({ event }) => event))];

    await page.goto(SCHEDULE_PATH);

    const cards = page.locator('[data-ticket-prices] article');

    await expect(cards).toHaveCount(slugs.length);

    for (const [index, slug] of slugs.entries()) {
      const event = EVENTS.find((candidate) => candidate.slug === slug)!;
      const card = cards.nth(index);

      await expect(card.getByRole('heading', { level: 3 })).toHaveText(event.title);
      await expect(card.locator('dt')).toHaveText(event.tariffs.map(({ kind }) => TARIFF_LABELS[kind]));
      await expect(card.locator('dd')).toHaveText(event.tariffs.map(({ amount }) => `${formatAmount(amount)} ₽`));
    }
  });
});

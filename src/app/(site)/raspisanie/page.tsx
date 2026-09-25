import type { Metadata } from 'next';
import { getSchedulePage } from '@/cms/schedule';
import { SiteFrame } from '@/components/SiteFrame';
import { SCHEDULE_PATH } from '@/lib/consts';
import { getTheme } from '@/lib/theme';
import { DATES_ANCHOR, SCHEDULE_LEAD, SCHEDULE_TITLE } from '../_schedule/consts';
import { EmptySchedule } from '../_schedule/EmptySchedule';
import { byMonth, eventsOf, filterRows, monthsOf, readFilters, scheduleRows } from '../_schedule/rows';
import { ScheduleFilters } from '../_schedule/ScheduleFilters';
import { ScheduleMonth } from '../_schedule/ScheduleMonth';
import { TicketPrices } from '../_schedule/TicketPrices';
import styles from './page.module.scss';

type SchedulePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const generateMetadata = async (): Promise<Metadata> => {
  const { site } = await getSchedulePage();

  return { title: `${SCHEDULE_TITLE} — ${site.name}`, description: SCHEDULE_LEAD };
};

const SchedulePage = async ({ searchParams }: SchedulePageProps) => {
  const [{ site, schedule }, theme, params] = await Promise.all([getSchedulePage(), getTheme(), searchParams]);
  const rows = scheduleRows(schedule, new Date());
  const filters = readFilters(params);
  const shown = filterRows(rows, filters);
  const events = eventsOf(rows);

  return (
    <SiteFrame
      site={site}
      theme={theme}
    >
      <header className={styles.intro}>
        <h1 className={styles.title}>{SCHEDULE_TITLE}</h1>
        <p className={styles.lead}>{SCHEDULE_LEAD}</p>
      </header>

      {rows.length ? (
        <>
          <div
            id={DATES_ANCHOR}
            className={styles.dates}
          >
            <ScheduleFilters
              months={monthsOf(rows)}
              events={events}
              filters={filters}
            />

            {shown.length ? (
              byMonth(shown).map((group) => (
                <ScheduleMonth
                  key={group.month}
                  group={group}
                />
              ))
            ) : (
              <p
                className={styles.nothing}
                data-schedule-nothing
              >
                По&nbsp;этому фильтру дат нет. <a href={SCHEDULE_PATH}>Показать все даты</a>
              </p>
            )}
          </div>

          <TicketPrices events={events} />
        </>
      ) : (
        <EmptySchedule site={site} />
      )}
    </SiteFrame>
  );
};

export default SchedulePage;

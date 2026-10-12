import type { Metadata } from 'next';
import { getSchedulePage, getScheduleEvents } from '@/cms/schedule';
import { MoreLink } from '@/components/MoreLink';
import { PageHead } from '@/components/PageHead';
import { SiteFrame } from '@/components/SiteFrame';
import { Split } from '@/components/Split';
import { SCHEDULE_PATH } from '@/lib/consts';
import { typograph } from '@/lib/format';
import { getTheme } from '@/lib/theme';
import { eventCards } from '../_home/cards';
import { DATES_ANCHOR, SCHEDULE_KICKERS, SCHEDULE_LEAD, SCHEDULE_TITLE } from '../_schedule/consts';
import { EmptySchedule } from '../_schedule/EmptySchedule';
import { byMonth, eventsOf, filterRows, monthsOf, readFilters, scheduleRows, seasonFacts } from '../_schedule/rows';
import { ScheduleFilters } from '../_schedule/ScheduleFilters';
import { ScheduleMonth } from '../_schedule/ScheduleMonth';
import { SeasonFacts } from '../_schedule/SeasonFacts';
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
  const facts = seasonFacts(rows);
  const lastDate = schedule.reduce<string | null>((last, { date }) => (!last || date > last ? date : last), null);

  return (
    <SiteFrame
      site={site}
      theme={theme}
      fullBleed
    >
      <PageHead
        kicker={SCHEDULE_KICKERS.head}
        title={typograph(SCHEDULE_TITLE)}
        lead={typograph(SCHEDULE_LEAD)}
        facts={facts ? <SeasonFacts facts={facts} /> : null}
      />

      {rows.length ? (
        <>
          <Split
            id={DATES_ANCHOR}
            rail={
              <ScheduleFilters
                months={monthsOf(rows)}
                events={events}
                filters={filters}
              />
            }
          >
            <div className={styles.months}>
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
                  По&nbsp;этому фильтру дат нет. <MoreLink href={SCHEDULE_PATH}>Показать все даты</MoreLink>
                </p>
              )}
            </div>
          </Split>

          <TicketPrices events={events} />
        </>
      ) : (
        <EmptySchedule
          site={site}
          cards={eventCards(await getScheduleEvents(), [], lastDate)}
        />
      )}
    </SiteFrame>
  );
};

export default SchedulePage;

import { TARIFF_LABELS } from '@/cms/consts';
import type { ScheduleItem } from '@/cms/types';
import { Button } from '@/components/Button';
import { CutBox } from '@/components/CutBox';
import { MoreLink } from '@/components/MoreLink';
import { Price } from '@/components/Price';
import { RunicText } from '@/components/RunicText';
import { Split } from '@/components/Split';
import { SCHEDULE_PATH } from '@/lib/consts';
import { formatAmount, formatDay, formatWeekday, phoneHref, typograph } from '@/lib/format';
import type { Event } from '@/payload-types';
import {
  DATES_TEXT,
  EMPTY_HEADING,
  EMPTY_TEXT,
  EVENT_KICKERS,
  EVENT_SECTIONS,
  LAST_DATE_NOTE,
  PRICE_LABELS,
  SCHEDULE_LINK,
  SEASON_CLOSED,
  SHOW_PREFIX,
  TICKET_LABEL,
} from '../../consts';
import { timeRange } from '../../view';
import shared from '../EventContent.module.scss';
import styles from './Dates.module.scss';

export type DatesProps = {
  event: Pick<Event, 'tariffs' | 'perks' | 'ticketUrl'>;
  /** Даты, которые еще не закончились, от ближайшей. */
  upcoming: ScheduleItem[];
  /** Последняя прошедшая дата события: по ней подписан закрытый сезон. */
  last: ScheduleItem | undefined;
  phone: string;
};

const { id, heading } = EVENT_SECTIONS.dates;

/**
 * «Даты и цена»: строка на каждую дату с кассой события, под ними панель цены со всеми видами билета и льготами.
 * Будущих дат нет (сезон закрыт) — вместо строк пустое состояние с телефоном владельцев, цены подписаны как прошлогодние.
 */
export const Dates = ({ event, upcoming, last, phone }: DatesProps) => {
  const priceLabel =
    !upcoming.length && last ? PRICE_LABELS.past : PRICE_LABELS[event.tariffs.length > 1 ? 'many' : 'one'];
  const perks = event.perks ?? [];

  return (
    <Split
      id={id}
      labelledBy={`${id}-title`}
      rail={
        <>
          <RunicText size="kicker">{EVENT_KICKERS.dates}</RunicText>
          <h2
            className={shared.title}
            id={`${id}-title`}
          >
            {heading}
          </h2>
          {upcoming.length ? <p>{DATES_TEXT}</p> : null}
          <MoreLink href={SCHEDULE_PATH}>{SCHEDULE_LINK}</MoreLink>
        </>
      }
    >
      <div className={shared.stack}>
        {upcoming.length ? (
          <div>
            <ol className={styles.list}>
              {upcoming.map((item) => {
                const [number, month] = formatDay(item.date).split(' ');

                return (
                  <li
                    key={item.id}
                    className={styles.row}
                    data-event-date
                  >
                    <time
                      className={styles.day}
                      dateTime={item.date}
                    >
                      <b className={styles.number}>{number}</b>
                      <span>{month}</span>
                      <span>{formatWeekday(item.date)}</span>
                    </time>

                    <div className={styles.main}>
                      <p className={styles.time}>{timeRange(item)}</p>
                      {item.show ? (
                        <p className={styles.show}>
                          {SHOW_PREFIX}
                          {item.show}
                        </p>
                      ) : null}
                    </div>

                    <div className={styles.buy}>
                      <div className={styles.ticket}>
                        <Button
                          size="sm"
                          href={event.ticketUrl}
                        >
                          {TICKET_LABEL}
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            {upcoming.length === 1 ? <p className={styles.note}>{LAST_DATE_NOTE}</p> : null}
          </div>
        ) : (
          <CutBox
            cut="lg"
            className={styles.empty}
          >
            {last ? (
              <p className={shared.caps}>
                {SEASON_CLOSED.before}
                {last.date.slice(0, 4)}
                {SEASON_CLOSED.after}
              </p>
            ) : null}
            <h3 className={styles.emptyHeading}>{EMPTY_HEADING}</h3>
            <p className={styles.emptyText}>{EMPTY_TEXT}</p>
            <p className={styles.contacts}>
              <a href={phoneHref(phone)}>{phone}</a>
            </p>
          </CutBox>
        )}

        <CutBox className={shared.panel}>
          <p className={shared.caps}>{priceLabel}</p>

          <dl className={styles.tariffs}>
            {event.tariffs.map((tariff, index) => (
              <div
                key={tariff.id ?? index}
                className={styles.tariff}
              >
                <dt className={styles.kind}>{TARIFF_LABELS[tariff.kind]}</dt>
                <dd className={styles.amount}>
                  <Price
                    value={formatAmount(tariff.amount)}
                    className={styles.price}
                  />
                </dd>
              </div>
            ))}
          </dl>

          {perks.length ? (
            <ul
              className={shared.facts}
              data-event-perks
            >
              {perks.map((perk) => (
                <li key={perk.id ?? perk.text}>{typograph(perk.text)}</li>
              ))}
            </ul>
          ) : null}
        </CutBox>
      </div>
    </Split>
  );
};

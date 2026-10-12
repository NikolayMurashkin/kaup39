import { TARIFF_LABELS } from '@/cms/consts';
import { CutBox } from '@/components/CutBox';
import { MoreLink } from '@/components/MoreLink';
import { Price } from '@/components/Price';
import { RunicText } from '@/components/RunicText';
import { Split } from '@/components/Split';
import { EVENT_PATH } from '@/lib/consts';
import { formatAmount, typograph } from '@/lib/format';
import { PRICES_ANCHOR, PRICES_TEXT, SCHEDULE_KICKERS } from '../consts';
import type { ScheduleEvent } from '../types';
import styles from './TicketPrices.module.scss';

export type TicketPricesProps = {
  events: ScheduleEvent[];
};

/** Все виды билета каждого события: в строке расписания стоит только самый дешевый. */
export const TicketPrices = ({ events }: TicketPricesProps) => (
  <Split
    id={PRICES_ANCHOR}
    labelledBy={`${PRICES_ANCHOR}-title`}
    rail={
      <>
        <RunicText size="kicker">{SCHEDULE_KICKERS.prices}</RunicText>
        <h2
          className={styles.title}
          id={`${PRICES_ANCHOR}-title`}
        >
          Цены билетов
        </h2>
        <p>{typograph(PRICES_TEXT)}</p>
      </>
    }
  >
    <div
      className={styles.grid}
      data-ticket-prices
    >
      {events.map((event) => (
        <CutBox
          key={event.slug}
          as="article"
          className={styles.card}
        >
          <h3 className={styles.name}>{typograph(event.title)}</h3>

          <dl className={styles.list}>
            {event.tariffs.map((tariff) => (
              <div
                key={tariff.kind}
                className={styles.row}
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

          <MoreLink href={`${EVENT_PATH}/${event.slug}`}>О&nbsp;событии</MoreLink>
        </CutBox>
      ))}
    </div>
  </Split>
);

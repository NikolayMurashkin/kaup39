import { TARIFF_LABELS } from '@/cms/consts';
import { CutBox } from '@/components/CutBox';
import { Price } from '@/components/Price';
import { SectionHead } from '@/components/SectionHead';
import { formatAmount, typograph } from '@/lib/format';
import type { ScheduleEvent } from '../types';
import styles from './TicketPrices.module.scss';

export type TicketPricesProps = {
  events: ScheduleEvent[];
};

/** Все виды билета каждого события: в строке расписания стоит только самый дешевый. */
export const TicketPrices = ({ events }: TicketPricesProps) => (
  <section
    className={styles.section}
    data-ticket-prices
  >
    <SectionHead heading="Цены билетов" />

    <div className={styles.grid}>
      {events.map((event) => (
        <CutBox
          key={event.slug}
          as="article"
          cut="sm"
          surface="raised"
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
                    tone="plain"
                    className={styles.price}
                  />
                </dd>
              </div>
            ))}
          </dl>
        </CutBox>
      ))}
    </div>
  </section>
);

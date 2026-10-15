import { Price } from '@/components/Price';
import { RunicText } from '@/components/RunicText';
import { Split } from '@/components/Split';
import { formatAmount, paragraphs, typograph } from '@/lib/format';
import { CAMPING_KICKERS } from '../../consts';
import type { CampingParts } from '../../types';
import shared from '../CampingContent.module.scss';
import styles from './Prices.module.scss';

export type PricesProps = {
  prices: NonNullable<CampingParts['prices']>;
};

/** Аренда места: заголовок раздела в рейке, строки цен в поле — что, пояснение и сумма. */
export const Prices = ({ prices }: PricesProps) => {
  const titleId = `${prices.anchor}-title`;

  return (
    <Split
      id={prices.anchor ?? undefined}
      labelledBy={prices.heading ? titleId : undefined}
      rail={
        <>
          <RunicText size="kicker">{CAMPING_KICKERS.prices}</RunicText>
          {prices.heading ? (
            <h2
              className={shared.title}
              id={titleId}
            >
              {typograph(prices.heading)}
            </h2>
          ) : null}
          {paragraphs(prices.intro).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </>
      }
    >
      <dl className={styles.rows}>
        {(prices.rows ?? []).map((row) => (
          <div
            key={row.id ?? row.label}
            className={styles.row}
          >
            <dt className={styles.label}>
              <b>{typograph(row.label)}</b>
              {row.note ? <span>{typograph(row.note)}</span> : null}
            </dt>
            <dd className={styles.amount}>
              <Price
                value={formatAmount(row.amount)}
                note={row.unit ? `за ${row.unit}` : undefined}
                className={styles.price}
              />
            </dd>
          </div>
        ))}
      </dl>

      {paragraphs(prices.footnote).map((note) => (
        <p
          key={note}
          className={shared.footnote}
        >
          {note}
        </p>
      ))}
    </Split>
  );
};

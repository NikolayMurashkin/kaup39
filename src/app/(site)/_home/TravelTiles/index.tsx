import { CutBox } from '@/components/CutBox';
import { Grain } from '@/components/Grain';
import { Price } from '@/components/Price';
import { DIRECTIONS_PATH } from '@/lib/consts';
import { formatAmount, typograph } from '@/lib/format';
import styles from './TravelTiles.module.scss';
import type { TransferSummary } from './types';

export type TravelTilesProps = {
  address: string;
  /** Раздел трансфера со страницы «как доехать»; нет раздела — нет и плашки. */
  transfer: TransferSummary | null;
};

/** Железные плашки под разделами: как добраться своим ходом и трансфером, обе ведут на «Как доехать». */
export const TravelTiles = ({ address, transfer }: TravelTilesProps) => (
  <div className={styles.tiles}>
    <CutBox
      surface="steel"
      className={styles.tile}
    >
      <Grain kind="iron" />
      <h2 className={styles.caps}>Как доехать</h2>
      <p className={styles.text}>{typograph(address)}</p>
      <a
        className={styles.link}
        href={DIRECTIONS_PATH}
      >
        Маршрут, автобус и&nbsp;парковка
      </a>
    </CutBox>

    {transfer ? (
      <CutBox
        surface="steel"
        className={styles.tile}
      >
        <Grain kind="iron" />
        <h2 className={styles.caps}>{typograph(transfer.heading)}</h2>
        {transfer.amount === null ? null : (
          <Price
            value={formatAmount(transfer.amount)}
            note={transfer.priceNote ?? undefined}
            tone="plain"
            className={styles.price}
          />
        )}
        {transfer.text ? <p className={styles.text}>{transfer.text}</p> : null}
        <a
          className={styles.link}
          href={`${DIRECTIONS_PATH}#${transfer.anchor}`}
        >
          Точки сбора и&nbsp;время отправления
        </a>
      </CutBox>
    ) : null}
  </div>
);

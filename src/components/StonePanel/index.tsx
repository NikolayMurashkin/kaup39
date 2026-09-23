import { Button } from '../Button';
import { CutBox } from '../CutBox';
import { Ornament } from '../Ornament';
import { Price } from '../Price';
import styles from './StonePanel.module.scss';
import type { StonePanelEvent } from './types';

export type StonePanelProps = {
  event: StonePanelEvent;
};

/** Панель ближайшего события: три шага от даты до билета, чтобы путь читался сверху вниз. */
export const StonePanel = ({ event }: StonePanelProps) => (
  <CutBox
    as="aside"
    surface="raised"
    shadow="stone"
    className={styles.panel}
  >
    <Ornament
      direction="vertical"
      className={styles.band}
    />

    <div className={styles.inner}>
      <p className={styles.step}>
        <b>шаг 1</b>
        <span className={styles.caps}>ближайшее событие</span>
      </p>

      <p className={styles.date}>{event.date}</p>
      <p className={styles.time}>{event.time}</p>
      <h2 className={styles.name}>{event.name}</h2>

      <p className={styles.step}>
        <b>шаг 2</b>
        <span className={styles.caps}>дата и&nbsp;цена</span>
      </p>

      <Price
        value={event.price}
        note={event.priceNote}
        className={styles.price}
      />

      <p className={styles.step}>
        <b>шаг 3</b>
        <span className={styles.caps}>билет</span>
      </p>

      <div className={styles.actions}>
        <Button
          block
          href={event.ticketUrl}
        >
          Купить билет
        </Button>

        <Button
          block
          kind="ghost"
          href={event.scheduleUrl}
        >
          {event.scheduleLabel}
        </Button>
      </div>
    </div>
  </CutBox>
);

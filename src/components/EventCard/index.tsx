import { Button } from '../Button';
import { CutBox } from '../CutBox';
import { PhotoSlot } from '../PhotoSlot';
import { Price } from '../Price';
import styles from './EventCard.module.scss';
import type { EventCardItem } from './types';

export type EventCardProps = {
  event: EventCardItem;
};

export const EventCard = ({ event }: EventCardProps) => (
  <CutBox
    as="article"
    shadow="plate"
    className={styles.card}
  >
    <PhotoSlot
      band
      className={styles.media}
    />

    <div className={styles.body}>
      <p className={styles.date}>
        {event.date} <span className={styles.time}>{event.time}</span>
      </p>

      <h3 className={styles.name}>{event.name}</h3>
      <p className={styles.note}>{event.note}</p>

      <div className={styles.foot}>
        <Price
          value={event.price}
          prefix={event.pricePrefix}
          note={event.priceNote}
        />

        <Button
          size="sm"
          href={event.ticketUrl}
        >
          Билет
        </Button>
      </div>
    </div>
  </CutBox>
);

import { RunicText } from '@/components/RunicText';
import { Split } from '@/components/Split';
import { paragraphs, typograph } from '@/lib/format';
import { DIRECTIONS_KICKERS } from '../../consts';
import type { DirectionsParts } from '../../types';
import { Photo } from '../Photo';
import styles from './Car.module.scss';

export type CarProps = {
  car: NonNullable<DirectionsParts['car']>;
};

/** «На машине»: текст о парковке в рейке, кадр с подписью в поле. Нет кадра — поле пустое, пустой рамки нет. */
export const Car = ({ car }: CarProps) => (
  <Split
    id={car.anchor ?? undefined}
    labelledBy={car.heading ? 'car-title' : undefined}
    rail={
      <>
        <RunicText size="kicker">{DIRECTIONS_KICKERS.car}</RunicText>
        {car.heading ? (
          <h2
            className={styles.title}
            id="car-title"
          >
            {typograph(car.heading)}
          </h2>
        ) : null}
        {paragraphs(car.body).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </>
    }
  >
    <Photo media={car.photo} />
  </Split>
);

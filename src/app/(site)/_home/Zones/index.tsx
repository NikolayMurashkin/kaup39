import { toPhoto } from '@/cms/photo';
import { Button } from '@/components/Button';
import { PlaceCard } from '@/components/PlaceCard';
import { RunicText } from '@/components/RunicText';
import { Section } from '@/components/Section';
import { SCHEDULE_PATH } from '@/lib/consts';
import { paragraphs, typograph } from '@/lib/format';
import type { Zone } from '@/payload-types';
import { KICKERS } from '../consts';
import styles from './Zones.module.scss';

export type ZonesProps = {
  anchor: string;
  heading: string;
  body?: string | null;
  zones: Zone[];
};

/**
 * Площадки по артборду v2: карточка-кнопка на каждую, диалог с кадром и описанием. Ряды — флексом, а не сеткой
 * 2×2 артборда: кадр есть у всех семи площадок, и сетка из одних больших карточек оставляла пустые клетки;
 * последний ряд растягивается на всю ширину.
 */
export const Zones = ({ anchor, heading, body, zones }: ZonesProps) => (
  <Section
    id={anchor}
    labelledBy={`${anchor}-title`}
  >
    <div className={styles.zones}>
      <div className={styles.head}>
        <RunicText size="kicker">{KICKERS.zones}</RunicText>
        <h2
          className={styles.title}
          id={`${anchor}-title`}
        >
          {typograph(heading)}
        </h2>
        {paragraphs(body).map((paragraph) => (
          <p
            key={paragraph}
            className={styles.text}
          >
            {paragraph}
          </p>
        ))}
      </div>

      {zones.map((zone) => {
        const photo = toPhoto(zone.photo);

        return (
          <div
            key={zone.id}
            className={photo ? styles.wide : styles.item}
          >
            <PlaceCard
              name={zone.name}
              number={zone.order}
              mark={zone.mark ?? 'house'}
              photo={photo}
              action="Подробнее"
            >
              {paragraphs(zone.description).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <Button
                kind="ghost"
                size="sm"
                href={SCHEDULE_PATH}
                className={styles.dates}
              >
                Даты и&nbsp;цены
              </Button>
            </PlaceCard>
          </div>
        );
      })}
    </div>
  </Section>
);

import { toPhoto } from '@/cms/photo';
import { RunicText } from '@/components/RunicText';
import { Section } from '@/components/Section';
import { paragraphs, typograph } from '@/lib/format';
import type { Zone } from '@/payload-types';
import { KICKERS } from '../consts';
import { ZoneCard } from './ZoneDialog';
import styles from './Zones.module.scss';

export type ZonesProps = {
  anchor: string;
  heading: string;
  body?: string | null;
  zones: Zone[];
};

/**
 * Площадки по артборду v2: карточка-кнопка на каждую, диалог с кадром (или слайдером кадров площадки) и описанием. Ряды — флексом, а не сеткой
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

      {zones.map((zone) => (
        <div
          key={zone.id}
          className={toPhoto(zone.photo) ? styles.wide : styles.item}
        >
          <ZoneCard zone={zone} />
        </div>
      ))}
    </div>
  </Section>
);

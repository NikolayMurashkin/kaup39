import { RunicText } from '@/components/RunicText';
import { Section } from '@/components/Section';
import { paragraphs, typograph } from '@/lib/format';
import type { MapPoint, Tavern, Zone } from '@/payload-types';
import { KICKERS } from '../consts';
import { PointDialog } from './PointDialog';
import { dotNumber, sortPoints } from './points';
import styles from './SettlementMap.module.scss';

export type SettlementMapProps = {
  anchor: string;
  heading: string;
  body?: string | null;
  points: MapPoint[];
  zones: Zone[];
  taverns: Tavern[];
};

/**
 * Карта поселения: рисунок владельцев маской цвета линий темы, поверх — метки-кнопки с номерами по x и y в процентах
 * рисунка, под ним — список «номер — название» на всех ширинах. Метка и строка открывают одно и то же окно точки;
 * на телефоне рисунок целиком и метки мелкие — нажимают строки списка. Точек нет — раздела нет.
 */
export const SettlementMap = ({ anchor, heading, body, points, zones, taverns }: SettlementMapProps) => {
  if (!points.length) return null;

  const sorted = sortPoints(points);

  return (
    <Section
      id={anchor}
      labelledBy={`${anchor}-title`}
    >
      <div className={styles.map}>
        <div className={styles.head}>
          <RunicText size="kicker">{KICKERS.map}</RunicText>
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

        <div className={styles.plate}>
          <div className={styles.canvas}>
            <span
              className={styles.drawing}
              aria-hidden
            />
            {sorted.map((point) => (
              <div
                key={point.id}
                className={styles.spot}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
              >
                <PointDialog
                  point={point}
                  zones={zones}
                  taverns={taverns}
                  triggerClassName={styles.dot}
                  triggerLabel={`${dotNumber(point.number)} — ${point.name}`}
                  trigger={dotNumber(point.number)}
                />
              </div>
            ))}
          </div>
        </div>

        <ol className={styles.list}>
          {sorted.map((point) => (
            <li
              key={point.id}
              className={styles.item}
            >
              <PointDialog
                point={point}
                zones={zones}
                taverns={taverns}
                triggerClassName={styles.row}
                trigger={
                  <>
                    <span className={styles.number}>{point.number}</span> —{' '}
                    <span className={styles.name}>{typograph(point.name)}</span>
                  </>
                }
              />
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
};

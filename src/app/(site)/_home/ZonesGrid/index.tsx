import type { Tavern, Zone } from '@/payload-types';
import { Grain } from '@/components/Grain';
import { Mark } from '@/components/Mark';
import { paragraphs, typograph } from '@/lib/format';
import styles from './ZonesGrid.module.scss';

export type ZonesGridProps = {
  zones: Zone[];
  taverns: Tavern[];
  /** Раздел с тавернами: последняя плитка ведет туда, если таверны есть. */
  kitchen?: { anchor: string; heading: string } | null;
};

/** Плитки площадок на дереве; последняя — таверны, со ссылкой на их раздел. */
export const ZonesGrid = ({ zones, taverns, kitchen }: ZonesGridProps) => (
  <ul className={styles.zones}>
    {zones.map((zone) => (
      <li
        key={zone.id}
        className={styles.zone}
      >
        <Grain kind="wood" />
        {zone.mark ? <Mark mark={zone.mark} /> : null}
        <h3 className={styles.name}>{typograph(zone.name)}</h3>
        {paragraphs(zone.description).map((paragraph) => (
          <p
            key={paragraph}
            className={styles.note}
          >
            {paragraph}
          </p>
        ))}
      </li>
    ))}

    {kitchen && taverns.length ? (
      <li className={styles.zone}>
        <Grain kind="wood" />
        <Mark mark="horn" />
        <h3 className={styles.name}>
          <a
            className={styles.link}
            href={`#${kitchen.anchor}`}
          >
            {typograph(kitchen.heading)}
          </a>
        </h3>
        <p className={styles.note}>{typograph(taverns.map((tavern) => `«${tavern.name}»`).join(', '))}</p>
      </li>
    ) : null}
  </ul>
);

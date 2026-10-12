import { MoreLink } from '@/components/MoreLink';
import { RunicText } from '@/components/RunicText';
import { Split } from '@/components/Split';
import { paragraphs, typograph } from '@/lib/format';
import { BUS_LINK_LABEL, DIRECTIONS_KICKERS } from '../../consts';
import type { DirectionsParts } from '../../types';
import styles from './Bus.module.scss';

export type BusProps = {
  bus: NonNullable<DirectionsParts['bus']>;
};

/** Рейсовые автобусы: маршруты списком, у каждого со ссылкой на расписание, если она есть в CMS. */
export const Bus = ({ bus }: BusProps) => (
  <Split
    id={bus.anchor ?? undefined}
    labelledBy={bus.heading ? 'bus-title' : undefined}
    rail={
      <>
        <RunicText size="kicker">{DIRECTIONS_KICKERS.bus}</RunicText>
        {bus.heading ? (
          <h2
            className={styles.title}
            id="bus-title"
          >
            {typograph(bus.heading)}
          </h2>
        ) : null}
        {paragraphs(bus.intro).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </>
    }
  >
    <ul className={styles.routes}>
      {(bus.items ?? []).map((route) => (
        <li
          key={route.id ?? route.title}
          className={styles.route}
        >
          <div className={styles.name}>
            <b>{typograph(route.title)}</b>
            {route.text ? <span>{typograph(route.text)}</span> : null}
          </div>
          {route.url ? (
            <MoreLink
              href={route.url}
              external
            >
              {BUS_LINK_LABEL}
            </MoreLink>
          ) : null}
        </li>
      ))}
    </ul>

    {paragraphs(bus.footnote).map((note) => (
      <p
        key={note}
        className={styles.footnote}
      >
        {note}
      </p>
    ))}
  </Split>
);

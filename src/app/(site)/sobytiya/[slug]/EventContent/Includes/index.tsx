import { RunicText } from '@/components/RunicText';
import { Split } from '@/components/Split';
import { typograph } from '@/lib/format';
import type { Event } from '@/payload-types';
import { EVENT_KICKERS, EVENT_SECTIONS, INCLUDES_LABELS } from '../../consts';
import shared from '../EventContent.module.scss';
import styles from './Includes.module.scss';

type EventItems = NonNullable<Event['includes']>;

export type IncludesProps = {
  includes: EventItems;
  extras: EventItems;
};

const { id, heading } = EVENT_SECTIONS.includes;

/** «Что входит»: что в стоимости билета и что за доплату; пустой список не выводится. */
export const Includes = ({ includes, extras }: IncludesProps) => (
  <Split
    id={id}
    labelledBy={`${id}-title`}
    rail={
      <>
        <RunicText size="kicker">{EVENT_KICKERS.includes}</RunicText>
        <h2
          className={shared.title}
          id={`${id}-title`}
        >
          {heading}
        </h2>
      </>
    }
  >
    <div className={shared.stack}>
      {(
        [
          ['includes', includes],
          ['extras', extras],
        ] as const
      ).map(([kind, items]) =>
        items.length ? (
          <div
            key={kind}
            className={styles.block}
          >
            <h3 className={`${shared.caps} ${shared.label}`}>{INCLUDES_LABELS[kind]}</h3>
            <ul className={`${shared.facts} ${styles.columns}`}>
              {items.map((item) => (
                <li key={item.id ?? item.text}>{typograph(item.text)}</li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </div>
  </Split>
);

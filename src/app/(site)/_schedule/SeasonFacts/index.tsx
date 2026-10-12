import type { SeasonFacts as Facts } from '../types';
import styles from './SeasonFacts.module.scss';

export type SeasonFactsProps = {
  facts: Facts;
};

/** Строка под подзаголовком расписания: сезон, сколько дат и событий и до какого дня. Последний день — в `<time>`. */
export const SeasonFacts = ({ facts }: SeasonFactsProps) => (
  <p className={styles.facts}>
    <span className={styles.caps}>сезон {facts.year}</span>
    <span className={styles.muted}>
      {facts.dates} до&nbsp;<time dateTime={facts.last.dateTime}>{facts.last.date}</time> · {facts.events}
    </span>
  </p>
);

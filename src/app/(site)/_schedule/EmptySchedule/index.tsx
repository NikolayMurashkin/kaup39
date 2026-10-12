import type { Site } from '@/payload-types';
import { CutBox } from '@/components/CutBox';
import { Section } from '@/components/Section';
import { phoneHref } from '@/lib/format';
import { SeasonEvents } from '../../_home/SeasonEvents';
import type { EventCardView } from '../../_home/types';
import { SEASON_ANCHOR, SEASON_HEADING, SEASON_TEXT } from '../consts';
import styles from './EmptySchedule.module.scss';

export type EmptyScheduleProps = {
  site: Pick<Site, 'phone' | 'email'>;
  /** Карточки событий сезона: даты у них закрыты, цены прошлогодние. Событий нет — раздела с карточками нет. */
  cards: EventCardView[];
};

/** Год закрытого сезона берется у карточек: у них он уже посчитан по последней дате расписания. */
const closedYear = (cards: EventCardView[]) => {
  const closed = cards.find((card) => card.dates.kind === 'closed');

  return closed?.dates.kind === 'closed' ? closed.dates.year : null;
};

/** Будущих дат нет: так демо показывается после конца сезона, и спросить о событиях можно напрямую. */
export const EmptySchedule = ({ site, cards }: EmptyScheduleProps) => {
  const year = closedYear(cards);

  return (
    <>
      <Section labelledBy="empty-title">
        <div data-schedule-empty>
          <CutBox
            cut="lg"
            className={styles.empty}
          >
            {year ? <p className={styles.caps}>сезон {year} закрыт</p> : null}
            <h2
              className={styles.heading}
              id="empty-title"
            >
              Ближайших дат пока нет
            </h2>
            <p className={styles.text}>
              Новые даты появятся на&nbsp;этой странице, как только их&nbsp;объявят. Спросить о&nbsp;событиях можно
              по&nbsp;телефону или почте.
            </p>

            <p className={styles.contacts}>
              <a href={phoneHref(site.phone)}>{site.phone}</a>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </p>
          </CutBox>
        </div>
      </Section>

      {cards.length ? (
        <SeasonEvents
          anchor={SEASON_ANCHOR}
          heading={SEASON_HEADING}
          body={SEASON_TEXT}
          cards={cards}
          scheduleLink={false}
        />
      ) : null}
    </>
  );
};

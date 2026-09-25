import type { Site } from '@/payload-types';
import { CutBox } from '@/components/CutBox';
import { phoneHref } from '@/lib/format';
import styles from './EmptySchedule.module.scss';

export type EmptyScheduleProps = {
  site: Pick<Site, 'phone' | 'email'>;
};

/** Будущих дат нет: так демо показывается после конца сезона, и спросить о событиях можно напрямую. */
export const EmptySchedule = ({ site }: EmptyScheduleProps) => (
  <section data-schedule-empty>
    <CutBox
      surface="raised"
      className={styles.empty}
    >
      <h2 className={styles.heading}>Ближайших дат пока нет</h2>
      <p className={styles.text}>
        Новые даты появятся на&nbsp;этой странице, как только их&nbsp;объявят. Спросить о&nbsp;событиях можно
        по&nbsp;телефону или почте.
      </p>

      <p className={styles.contacts}>
        <a
          className={styles.contact}
          href={phoneHref(site.phone)}
        >
          {site.phone}
        </a>
        <a
          className={styles.contact}
          href={`mailto:${site.email}`}
        >
          {site.email}
        </a>
      </p>
    </CutBox>
  </section>
);

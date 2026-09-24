import type { Site } from '@/payload-types';
import { NAV_LINKS, SCHEDULE_PATH } from '@/lib/consts';
import { phoneHref, typograph } from '@/lib/format';
import type { Theme } from '@/lib/types';
import { Button } from '../Button';
import { RunicText } from '../RunicText';
import { ThemeToggle } from '../ThemeToggle';
import { WORDMARK } from './consts';
import styles from './SiteHeader.module.scss';

export type SiteHeaderProps = {
  site: Pick<Site, 'name' | 'address' | 'phone'>;
  theme: Theme;
};

/**
 * Шапка направления. На узкой ширине разделы прячутся в меню, а кнопка «Билеты» остается на виду
 * и ведет в расписание: у каждой даты там своя кнопка кассы.
 */
export const SiteHeader = ({ site, theme }: SiteHeaderProps) => (
  <header className={styles.header}>
    <div className={styles.topline}>
      <p className={styles.caps}>{typograph(site.address)}</p>
    </div>

    <div className={styles.head}>
      <a
        className={styles.wordmark}
        href="/"
        aria-label={site.name}
      >
        <RunicText size="mark">{WORDMARK}</RunicText>
        <span className={styles.name}>{typograph(site.name)}</span>
      </a>

      <nav
        className={styles.nav}
        aria-label="Разделы"
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            className={styles.link}
            href={link.href}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className={styles.side}>
        <a
          className={styles.phone}
          href={phoneHref(site.phone)}
        >
          {site.phone}
        </a>

        <ThemeToggle theme={theme} />

        <Button
          size="sm"
          href={SCHEDULE_PATH}
          className={styles.tickets}
        >
          Билеты
        </Button>

        <details className={styles.menu}>
          <summary
            className={styles.burger}
            aria-label="Меню"
          >
            <i />
            <i />
            <i />
          </summary>

          <nav
            className={styles.drawer}
            aria-label="Разделы"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                className={styles.link}
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </details>
      </div>
    </div>
  </header>
);

import Link from 'next/link';
import type { Site } from '@/payload-types';
import { EVENT_LINKS, HEADER_LINKS, SCHEDULE_PATH } from '@/lib/consts';
import { phoneHref, typograph } from '@/lib/format';
import type { Theme } from '@/lib/types';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { RunicText } from '../RunicText';
import { ThemeToggle } from '../ThemeToggle';
import { SiteMenu } from './SiteMenu';
import { WORDMARK } from './consts';
import styles from './SiteHeader.module.scss';

export type SiteHeaderProps = {
  site: Pick<Site, 'name' | 'phone' | 'email'>;
  theme: Theme;
};

/**
 * Шапка v2 (D30, D34). От 1280 — вордмарк, пять пунктов, где «События» раскрывает две страницы, телефон, тема
 * и «Билеты». До 1279 пункты и телефон уходят в меню-диалог. «Билеты» ведут в расписание: у каждой даты там своя
 * кнопка кассы.
 */
export const SiteHeader = ({ site, theme }: SiteHeaderProps) => (
  <header className={styles.header}>
    <div className={styles.inner}>
      <Link
        className={styles.brand}
        href="/"
        prefetch={false}
        aria-label={site.name}
      >
        <RunicText size="mark">{WORDMARK}</RunicText>
        <span className={styles.caption}>{typograph(site.name)}</span>
      </Link>

      <nav
        className={styles.nav}
        aria-label="Разделы сайта"
      >
        {HEADER_LINKS.before.map((link) => (
          <Link
            key={link.href}
            className={styles.link}
            href={link.href}
            prefetch={false}
          >
            {link.label}
          </Link>
        ))}

        <details className={styles.events}>
          <summary className={styles.link}>
            События
            <Icon
              name="down"
              className={styles.chevron}
            />
          </summary>

          <div className={styles.eventsMenu}>
            {EVENT_LINKS.map((link) => (
              <Link
                key={link.href}
                className={styles.eventLink}
                href={link.href}
                prefetch={false}
              >
                {link.label}
                {link.note ? <small className={styles.note}>{link.note}</small> : null}
              </Link>
            ))}
          </div>
        </details>

        {HEADER_LINKS.after.map((link) => (
          <Link
            key={link.href}
            className={styles.link}
            href={link.href}
            prefetch={false}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className={styles.side}>
        <a
          className={styles.phone}
          href={phoneHref(site.phone)}
        >
          {site.phone}
        </a>

        <ThemeToggle
          theme={theme}
          className={styles.theme}
        />

        <Button
          kind="ghost"
          size="sm"
          href={SCHEDULE_PATH}
          className={styles.tickets}
        >
          Билеты
        </Button>

        <SiteMenu
          site={site}
          theme={theme}
          className={styles.menu}
        />
      </div>
    </div>
  </header>
);

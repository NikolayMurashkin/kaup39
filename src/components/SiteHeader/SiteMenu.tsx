import Link from 'next/link';
import type { Site } from '@/payload-types';
import { phoneHref } from '@/lib/format';
import type { Theme } from '@/lib/types';
import { Dialog } from '../Dialog';
import { Icon } from '../Icon';
import { RunicText } from '../RunicText';
import { ThemeToggle } from '../ThemeToggle';
import { EVENT_HREFS, MENU_LINKS, WORDMARK } from './consts';
import styles from './SiteMenu.module.scss';

export type SiteMenuProps = {
  site: Pick<Site, 'phone' | 'email'>;
  theme: Theme;
  className?: string;
};

/** Меню до 1279: диалог со всеми шестью страницами, телефоном, почтой и темой; на телефоне — во весь экран. */
export const SiteMenu = ({ site, theme, className }: SiteMenuProps) => (
  <Dialog
    triggerIcon="menu"
    triggerLabel="Меню"
    triggerClassName={className}
    label="Меню"
    fullOnPhone
    heading={<RunicText size="mark">{WORDMARK}</RunicText>}
  >
    <nav
      className={styles.pages}
      aria-label="Все страницы"
    >
      {MENU_LINKS.map((link) => (
        <Link
          key={link.href}
          className={[styles.page, EVENT_HREFS.has(link.href) ? styles.sub : null].filter(Boolean).join(' ')}
          href={link.href}
          prefetch={false}
        >
          {link.label}
          <Icon
            name="arrow"
            className={styles.arrow}
          />
        </Link>
      ))}
    </nav>

    <div className={styles.contacts}>
      <a href={phoneHref(site.phone)}>{site.phone}</a>
      <a href={`mailto:${site.email}`}>{site.email}</a>
    </div>

    <div className={styles.foot}>
      <ThemeToggle
        theme={theme}
        variant="text"
      />
    </div>
  </Dialog>
);

import Link from 'next/link';
import type { Site } from '@/payload-types';
import { DEMO_NOTE, SITE_PAGES } from '@/lib/consts';
import { phoneHref, typograph } from '@/lib/format';
import { RunicText } from '../RunicText';
import { WORDMARK } from '../SiteHeader/consts';
import styles from './SiteFooter.module.scss';

export type SiteFooterProps = {
  site: Pick<Site, 'name' | 'address' | 'phone' | 'email' | 'socials' | 'legal' | 'ageNote'>;
};

/** Подвал v2: вордмарк с адресом, контакты, все шесть страниц, соцсети; внизу юрлицо, возраст и подпись демо. */
export const SiteFooter = ({ site }: SiteFooterProps) => (
  <footer className={styles.footer}>
    <div className={styles.grid}>
      <div className={styles.brand}>
        <RunicText size="mark">{WORDMARK}</RunicText>
        <p className={styles.about}>
          {typograph(site.name)}. {typograph(site.address)}
        </p>
      </div>

      <address className={styles.column}>
        <p className={styles.caps}>Контакты</p>
        <a
          className={styles.link}
          href={phoneHref(site.phone)}
        >
          {site.phone}
        </a>
        <a
          className={styles.link}
          href={`mailto:${site.email}`}
        >
          {site.email}
        </a>
      </address>

      <nav
        className={styles.column}
        aria-label="Страницы"
      >
        <p className={styles.caps}>Страницы</p>
        {SITE_PAGES.map((link) => (
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

      {site.socials?.length ? (
        <div className={styles.column}>
          <p className={styles.caps}>Соцсети</p>
          {site.socials.map((social) => (
            <a
              key={social.url}
              className={styles.link}
              href={social.url}
              target="_blank"
              rel="noopener"
            >
              {social.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>

    <div className={styles.base}>
      {site.legal ? <span>{typograph(site.legal)}</span> : null}
      {site.ageNote ? <span>{typograph(site.ageNote)}</span> : null}
      <span className={styles.demo}>{DEMO_NOTE}</span>
    </div>
  </footer>
);

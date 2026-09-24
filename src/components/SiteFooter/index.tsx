import type { Site } from '@/payload-types';
import { NAV_LINKS } from '@/lib/consts';
import { phoneHref, typograph } from '@/lib/format';
import styles from './SiteFooter.module.scss';

export type SiteFooterProps = {
  site: Pick<Site, 'address' | 'phone' | 'email' | 'socials' | 'legal' | 'ageNote'>;
};

export const SiteFooter = ({ site }: SiteFooterProps) => (
  <footer className={styles.footer}>
    <div className={styles.columns}>
      <address className={styles.contacts}>
        <p className={styles.caps}>Контакты</p>
        <p className={styles.text}>{typograph(site.address)}</p>
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
      </address>

      <nav
        className={styles.links}
        aria-label="Разделы в подвале"
      >
        <p className={styles.caps}>Разделы</p>
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            className={styles.contact}
            href={link.href}
          >
            {link.label}
          </a>
        ))}
      </nav>

      {site.socials?.length ? (
        <div className={styles.links}>
          <p className={styles.caps}>Соцсети</p>
          {site.socials.map((social) => (
            <a
              key={social.url}
              className={styles.contact}
              href={social.url}
              rel="noopener"
            >
              {social.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>

    <div className={styles.legal}>
      {site.legal ? <p className={styles.text}>{typograph(site.legal)}</p> : null}
      {site.ageNote ? <p className={styles.text}>{typograph(site.ageNote)}</p> : null}
    </div>
  </footer>
);

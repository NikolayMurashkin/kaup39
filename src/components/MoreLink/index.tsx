import type { ReactNode } from 'react';
import { Icon } from '../Icon';
import styles from './MoreLink.module.scss';

export type MoreLinkProps = {
  href: string;
  children: ReactNode;
  /** Ссылка на чужой сайт: открывается в новой вкладке. */
  external?: boolean;
};

/** Текстовая ссылка со стрелкой и линией снизу — как «Все даты и цены» и «О событии» артборда v2. */
export const MoreLink = ({ href, children, external = false }: MoreLinkProps) => (
  <a
    className={styles.more}
    href={href}
    target={external ? '_blank' : undefined}
    rel={external ? 'noopener noreferrer' : undefined}
  >
    {children}
    <Icon
      name="arrow"
      className={styles.icon}
    />
  </a>
);

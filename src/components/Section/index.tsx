import type { ReactNode } from 'react';
import styles from './Section.module.scss';

export type SectionProps = {
  children: ReactNode;
  id?: string;
  labelledBy?: string;
  className?: string;
};

/** Раздел страницы v2 в контейнере 1328 px с полями `--page-margin` и отступом ритма `--space-section` сверху. */
export const Section = ({ children, id, labelledBy, className }: SectionProps) => (
  <section
    className={[styles.section, className].filter(Boolean).join(' ')}
    id={id}
    aria-labelledby={labelledBy}
  >
    {children}
  </section>
);

import type { ReactNode } from 'react';
import type { Site } from '@/payload-types';
import type { Theme } from '@/lib/types';
import { SiteFooter } from '../SiteFooter';
import { SiteHeader } from '../SiteHeader';
import { SvgDefs } from '../SvgDefs';
import styles from './SiteFrame.module.scss';

export type SiteFrameProps = {
  site: Site;
  theme: Theme;
  children: ReactNode;
};

/** Рамка каждой страницы демо: спрайт направления, шапка, содержимое страницы и подвал. */
export const SiteFrame = ({ site, theme, children }: SiteFrameProps) => (
  <div className={styles.frame}>
    <SvgDefs />
    <SiteHeader
      site={site}
      theme={theme}
    />

    <main className={styles.main}>{children}</main>

    <SiteFooter site={site} />
  </div>
);

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
  /** Страница на сетке v2: разделы сами держат поля страницы, а полосы идут во всю ширину окна. */
  fullBleed?: boolean;
  children: ReactNode;
};

/** Рамка каждой страницы демо: спрайт направления, шапка, содержимое страницы и подвал. */
export const SiteFrame = ({ site, theme, fullBleed = false, children }: SiteFrameProps) => (
  <div className={styles.frame}>
    <SvgDefs />
    <SiteHeader
      site={site}
      theme={theme}
    />

    <main className={fullBleed ? styles.bleed : styles.main}>{children}</main>

    <SiteFooter site={site} />
  </div>
);

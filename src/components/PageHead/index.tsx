import type { ReactNode } from 'react';
import { RunicText } from '../RunicText';
import styles from './PageHead.module.scss';

export type PageHeadProps = {
  /** Руническая подпись над заголовком. */
  kicker: string;
  title: string;
  /** Подзаголовок страницы: без него шапка страницы — рунная подпись и заголовок. */
  lead?: string | null;
  /** Под подзаголовком, за линией: факты страницы, адрес, маршруты. */
  facts?: ReactNode;
  /** Справа от текста, а на узком окне под ним: карта. */
  aside?: ReactNode;
};

/** Шапка внутренней страницы v2: рунная подпись, заголовок, подзаголовок, факты и блок справа. */
export const PageHead = ({ kicker, title, lead, facts, aside }: PageHeadProps) => (
  <header className={styles.head}>
    <div className={styles.text}>
      <RunicText size="kicker">{kicker}</RunicText>
      <h1 className={styles.title}>{title}</h1>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
      {facts}
    </div>

    {aside ? <div className={styles.aside}>{aside}</div> : null}
  </header>
);

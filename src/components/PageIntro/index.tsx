import styles from './PageIntro.module.scss';

export type PageIntroProps = {
  title: string;
  /** Подзаголовок страницы: без него шапка страницы — один заголовок. */
  lead?: string | null;
};

/** Заголовок и подзаголовок внутренней страницы — расписания, «как доехать». */
export const PageIntro = ({ title, lead }: PageIntroProps) => (
  <header className={styles.intro}>
    <h1 className={styles.title}>{title}</h1>
    {lead ? <p className={styles.lead}>{lead}</p> : null}
  </header>
);

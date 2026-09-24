import styles from './SectionHead.module.scss';

export type SectionHeadProps = {
  heading: string;
};

/** Заголовок раздела и линия до края колонки — как у разделов артборда. */
export const SectionHead = ({ heading }: SectionHeadProps) => (
  <div className={styles.head}>
    <h2 className={styles.title}>{heading}</h2>
    <i className={styles.rule} />
  </div>
);

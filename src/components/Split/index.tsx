import type { ReactNode } from 'react';
import styles from './Split.module.scss';

export type SplitProps = {
  /** Рейка: руническая подпись, заголовок, короткий текст, ссылка. */
  rail: ReactNode;
  /** Поле: карточки, мозаика, таблицы. */
  children: ReactNode;
  id?: string;
  labelledBy?: string;
  className?: string;
};

/**
 * Раздел сетки v2 вместо двенадцати колонок: асимметричная пара «рейка — поле» в контейнере страницы. Пока полю
 * остается не меньше 600 px, рейка стоит слева и липнет под шапкой; когда меньше — встает над полем во всю ширину.
 */
export const Split = ({ rail, children, id, labelledBy, className }: SplitProps) => (
  <section
    className={[styles.section, className].filter(Boolean).join(' ')}
    id={id}
    aria-labelledby={labelledBy}
  >
    <div className={styles.split}>
      <div className={styles.rail}>
        <div className={styles.railInner}>{rail}</div>
      </div>
      <div className={styles.field}>{children}</div>
    </div>
  </section>
);

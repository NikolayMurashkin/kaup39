import styles from './Price.module.scss';
import type { PriceTone } from './types';

export type PriceProps = {
  /** Число уже отформатировано: компонент не решает, как разделять разряды. */
  value: string;
  /** Подпись под ценой: «входной билет», «детский билет». */
  note?: string;
  /** Приписка перед числом: «от». */
  prefix?: string;
  /** Цвет: акцентный — по умолчанию, простой — цвет окружения, например на таблице цен. */
  tone?: PriceTone;
  className?: string;
};

/**
 * Знак рубля — отдельный элемент текстовой гарнитурой: в Ponomar его нет вовсе.
 * Между числом и знаком стоит неразрывный пробел, а перенос в этом месте запрещен отдельно —
 * глобальный `overflow-wrap: anywhere` разрешает разрыв даже на неразрывном пробеле.
 */
export const Price = ({ value, note, prefix, tone = 'accent', className }: PriceProps) => (
  <p
    className={[styles.price, styles[tone], className].filter(Boolean).join(' ')}
    data-price
  >
    <span className={styles.amount}>
      {prefix ? `${prefix} ` : ''}
      {value}
      {' '}
      <span
        className={styles.rub}
        data-rub
      >
        ₽
      </span>
    </span>

    {note ? <span className={styles.note}>{note}</span> : null}
  </p>
);

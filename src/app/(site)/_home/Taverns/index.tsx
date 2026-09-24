import type { Tavern } from '@/payload-types';
import { CutBox } from '@/components/CutBox';
import { Price } from '@/components/Price';
import { formatAmount, paragraphs, typograph } from '@/lib/format';
import styles from './Taverns.module.scss';

export type TavernsProps = {
  taverns: Tavern[];
};

const priceOf = (price: number, priceTo?: number | null) =>
  priceTo ? `${formatAmount(price)}–${formatAmount(priceTo)}` : formatAmount(price);

/** Таверны карточками; меню свернуто, чтобы три длинных меню не растягивали главную. */
export const Taverns = ({ taverns }: TavernsProps) => (
  <div className={styles.taverns}>
    {taverns.map((tavern) => (
      <CutBox
        key={tavern.id}
        as="article"
        bordered
        className={styles.tavern}
      >
        <h3 className={styles.name}>{typograph(tavern.name)}</h3>

        {paragraphs(tavern.description).map((paragraph) => (
          <p
            key={paragraph}
            className={styles.text}
          >
            {paragraph}
          </p>
        ))}

        {tavern.menu?.length ? (
          <details className={styles.menu}>
            <summary className={styles.summary}>Меню и&nbsp;цены</summary>

            {tavern.menu.map((part) => (
              <div
                key={part.id ?? part.title}
                className={styles.part}
              >
                {part.title ? <h4 className={styles.caps}>{typograph(part.title)}</h4> : null}

                <dl className={styles.rows}>
                  {(part.items ?? []).map((item) => (
                    <div
                      key={item.id ?? item.name}
                      className={styles.row}
                    >
                      <dt className={styles.dish}>
                        {typograph(item.name)}
                        {item.note ? <span className={styles.note}>{typograph(item.note)}</span> : null}
                      </dt>
                      <dd className={styles.amount}>
                        <Price
                          value={priceOf(item.price, item.priceTo)}
                          tone="plain"
                          className={styles.price}
                        />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </details>
        ) : null}
      </CutBox>
    ))}
  </div>
);

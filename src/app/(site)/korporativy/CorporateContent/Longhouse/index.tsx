import { Split } from '@/components/Split';
import { NBSP, paragraphs, typograph } from '@/lib/format';
import { CORPORATE_HEADINGS, CORPORATE_KICKERS, CORPORATE_PARTS } from '../../consts';
import { rentNote } from '../../parts';
import type { CorporateParts, RentPrice } from '../../types';
import shared from '../CorporateContent.module.scss';
import { Rail } from '../Rail';
import styles from './Longhouse.module.scss';

export type LonghouseProps = {
  longhouse: CorporateParts['longhouse'];
  capacity: CorporateParts['capacity'];
  /** Первая цена аренды: стоит в ряду цифр рядом с вместимостью. */
  price: RentPrice | null;
};

/**
 * Длинный дом: описание (первый абзац крупно) и ряд цифр — вместимость из CMS и цена аренды за час. Нет описания —
 * заголовок раздела вместимости.
 */
export const Longhouse = ({ longhouse, capacity, price }: LonghouseProps) => {
  const anchor = longhouse?.anchor ?? capacity?.anchor ?? CORPORATE_PARTS.longhouse.anchor;
  const titleId = `${anchor}-title`;
  const [lead, ...rest] = paragraphs(longhouse?.body);
  const items = capacity?.items ?? [];
  const heading = longhouse?.heading?.trim() || capacity?.heading?.trim() || CORPORATE_HEADINGS.capacity;

  return (
    <Split
      id={anchor}
      labelledBy={titleId}
      rail={
        <Rail
          kicker={CORPORATE_KICKERS.longhouse}
          heading={heading}
          titleId={titleId}
          text={longhouse ? null : capacity?.intro}
        />
      }
    >
      <div className={styles.about}>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
        {rest.length ? (
          <div className={shared.prose}>
            {rest.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : null}

        {items.length || price ? (
          <ul
            className={styles.numbers}
            aria-label={capacity?.heading?.trim() || undefined}
          >
            {items.map((item) => (
              <li key={item.id ?? item.title}>
                <b>{typograph(item.title)}</b>
                {item.text ? <span>{typograph(item.text)}</span> : null}
              </li>
            ))}
            {price ? (
              <li>
                <b className={styles.amount}>
                  {price.amount}
                  {NBSP}
                  <span className={shared.rub}>₽</span>
                </b>
                <span>{typograph(rentNote(price))}</span>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </Split>
  );
};

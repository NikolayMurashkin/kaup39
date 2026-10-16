import { Fragment } from 'react';
import { CutBox } from '@/components/CutBox';
import { Split } from '@/components/Split';
import { NBSP, paragraphs, phoneHref, typograph } from '@/lib/format';
import { CORPORATE_HEADINGS, CORPORATE_KICKERS, CORPORATE_PARTS } from '../../consts';
import { rentNote, rentPrices } from '../../parts';
import type { CorporateParts } from '../../types';
import shared from '../CorporateContent.module.scss';
import { Rail } from '../Rail';
import styles from './Rent.module.scss';

export type RentProps = {
  rent: CorporateParts['rent'];
  prices: CorporateParts['rentPrices'];
  /** Телефон владельцев: в тексте панели он — ссылка для звонка. */
  phone: string;
};

/** Абзац панели, где телефон владельцев — ссылкой для звонка; номера в тексте нет — абзац как есть. */
const withPhone = (text: string, phone: string) =>
  phone
    ? text.split(phone).map((part, index) => (
        <Fragment key={`${index}-${part}`}>
          {index ? <a href={phoneHref(phone)}>{phone}</a> : null}
          {part}
        </Fragment>
      ))
    : text;

/**
 * Аренда поселения: в рейке заголовок и текст раздела аренды, в поле панель с ценой крупно — из строк раздела цен,
 * правка суммы в админке меняет и ее. Нет текста аренды — заголовок раздела цен стоит в рейке. Телефон владельцев
 * в тексте панели — ссылка для звонка.
 */
export const Rent = ({ rent, prices, phone }: RentProps) => {
  const anchor = rent?.anchor ?? prices?.anchor ?? CORPORATE_PARTS.rent.anchor;
  const titleId = `${anchor}-title`;
  const rentHeading = rent?.heading?.trim();
  const pricesHeading = prices?.heading?.trim();
  const rows = rentPrices(prices);
  const notes = [...paragraphs(prices?.intro), ...paragraphs(prices?.footnote)];

  return (
    <Split
      id={anchor}
      labelledBy={titleId}
      rail={
        <Rail
          kicker={CORPORATE_KICKERS.rent}
          heading={rentHeading || pricesHeading || CORPORATE_HEADINGS.rent}
          titleId={titleId}
          text={rent?.body}
        />
      }
    >
      {prices ? (
        <CutBox
          surface="surface"
          className={styles.panel}
        >
          {rentHeading && pricesHeading ? <h3 className={shared.caps}>{typograph(pricesHeading)}</h3> : null}
          {rows.length ? (
            <ul className={styles.prices}>
              {rows.map((row, index) => (
                <li
                  key={`${index}-${row.label}`}
                  className={styles.price}
                >
                  <b className={styles.amount}>
                    {row.amount}
                    {NBSP}
                    <span className={shared.rub}>₽</span>
                  </b>
                  <span className={shared.caps}>{typograph(rentNote(row))}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {notes.map((note) => (
            <p
              key={note}
              className={styles.note}
            >
              {withPhone(note, phone.trim())}
            </p>
          ))}
        </CutBox>
      ) : null}
    </Split>
  );
};

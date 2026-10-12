import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Price } from '@/components/Price';
import { RunicText } from '@/components/RunicText';
import { Split } from '@/components/Split';
import { formatAmount, paragraphs, typograph } from '@/lib/format';
import { DIRECTIONS_KICKERS } from '../../consts';
import type { DirectionsParts } from '../../types';
import { Photo } from '../Photo';
import styles from './Transfer.module.scss';

export type TransferProps = {
  parts: DirectionsParts;
};

type ItemTitleProps = {
  title: string;
  url?: string | null;
};

type TicketProps = {
  ticket: DirectionsParts['ticket'];
  /** Кнопка в блоке цены: ширина по блоку, без своего промежутка рейки. Цены нет — кнопка стоит в рейке сама. */
  inPrice?: boolean;
};

type NotesProps = {
  text?: string | null;
  className: string;
};

/** Пункт со ссылкой из CMS — ссылка на чужой сайт в новой вкладке: валидатор пропускает только полный https-адрес. */
const ItemTitle = ({ title, url }: ItemTitleProps) =>
  url ? (
    <a
      className={styles.link}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {typograph(title)}
    </a>
  ) : (
    typograph(title)
  );

const Notes = ({ text, className }: NotesProps) =>
  paragraphs(text).map((paragraph) => (
    <p
      key={paragraph}
      className={className}
    >
      {paragraph}
    </p>
  ));

const Ticket = ({ ticket, inPrice = false }: TicketProps) =>
  ticket?.links?.length ? (
    <div
      id={ticket.anchor ?? undefined}
      className={inPrice ? styles.priceTicket : styles.ticket}
    >
      {ticket.heading ? <h3 className={styles.caps}>{typograph(ticket.heading)}</h3> : null}
      <div className={inPrice ? styles.priceTickets : styles.tickets}>
        {ticket.links.map((link) => (
          <Button
            key={link.id ?? link.url}
            href={link.url}
          >
            {typograph(link.label)}
          </Button>
        ))}
      </div>
    </div>
  ) : null;

/**
 * Трансфер: слева рейка с текстом и блоком цены, в котором стоит кнопка кассы, справа точки сбора, оповещение
 * о времени отправления, правила и кадр. Любая из частей может отсутствовать; раздел встает, если есть хоть одна.
 * Якорь `transfer` — цель ссылки с главной. Заполненное в админке поле части видно на странице, пустое не оставляет
 * пустой обертки.
 */
export const Transfer = ({ parts: { transfer, stops, price, rules, ticket } }: TransferProps) => {
  if (!transfer && !stops && !price && !rules && !ticket) return null;

  return (
    <Split
      id="transfer"
      labelledBy={transfer?.heading ? 'transfer-title' : undefined}
      rail={
        <>
          <RunicText size="kicker">{DIRECTIONS_KICKERS.transfer}</RunicText>
          {transfer?.heading ? (
            <h2
              className={styles.title}
              id="transfer-title"
            >
              {typograph(transfer.heading)}
            </h2>
          ) : null}
          {paragraphs(transfer?.body).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          {price ? (
            <div
              id={price.anchor ?? undefined}
              className={styles.price}
            >
              {price.heading ? <h3 className={styles.caps}>{typograph(price.heading)}</h3> : null}
              <Notes
                text={price.intro}
                className={styles.intro}
              />
              {(price.rows ?? []).map((row) => (
                <div
                  key={row.id ?? row.label}
                  className={styles.row}
                >
                  <Price
                    value={formatAmount(row.amount)}
                    className={styles.amount}
                  />
                  <span className={styles.caps}>{typograph(row.label)}</span>
                  {row.unit ? <span className={styles.muted}>{typograph(`за ${row.unit}`)}</span> : null}
                  {row.note ? <span className={styles.muted}>{typograph(row.note)}</span> : null}
                </div>
              ))}
              <Notes
                text={price.footnote}
                className={styles.footnote}
              />
              <Ticket
                ticket={ticket}
                inPrice
              />
            </div>
          ) : (
            <Ticket ticket={ticket} />
          )}
        </>
      }
    >
      <div className={styles.stack}>
        {stops ? (
          <div className={styles.block}>
            {stops.heading ? <h3 className={styles.caps}>{typograph(stops.heading)}</h3> : null}
            <Notes
              text={stops.intro}
              className={styles.intro}
            />
            <ul
              id={stops.anchor ?? undefined}
              className={styles.stops}
            >
              {(stops.items ?? []).map((stop) => (
                <li
                  key={stop.id ?? stop.title}
                  className={styles.stop}
                >
                  <b>
                    <ItemTitle
                      title={stop.title}
                      url={stop.url}
                    />
                  </b>
                  {stop.text ? <span>{typograph(stop.text)}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {paragraphs(stops?.footnote).map((notice) => (
          <p
            key={notice}
            className={styles.notice}
          >
            <Icon
              name="mail"
              className={styles.mail}
            />
            <span>{notice}</span>
          </p>
        ))}

        {rules ? (
          <div className={styles.block}>
            {rules.heading ? <h3 className={styles.caps}>{typograph(rules.heading)}</h3> : null}
            <Notes
              text={rules.intro}
              className={styles.intro}
            />
            <ul
              id={rules.anchor ?? undefined}
              className={styles.rules}
            >
              {(rules.items ?? []).map((rule) => (
                <li key={rule.id ?? rule.title}>
                  <span>
                    <ItemTitle
                      title={rule.title}
                      url={rule.url}
                    />
                    {rule.text ? <span className={styles.muted}>{typograph(rule.text)}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
            <Notes
              text={rules.footnote}
              className={styles.footnote}
            />
          </div>
        ) : null}

        <Photo media={transfer?.photo} />
      </div>
    </Split>
  );
};

import { CutBox } from '@/components/CutBox';
import { Icon } from '@/components/Icon';
import { RunicText } from '@/components/RunicText';
import { Split } from '@/components/Split';
import { paragraphs, typograph } from '@/lib/format';
import type { Site } from '@/payload-types';
import {
  EVENT_KICKERS,
  EVENT_SECTIONS,
  REFUND_FULL_TEXT,
  REFUND_HOW,
  REFUND_MAIL,
  REFUND_TERMS_HEAD,
  REFUND_TEXT,
} from '../../consts';
import shared from '../EventContent.module.scss';
import styles from './Refund.module.scss';

export type RefundProps = {
  refund: NonNullable<Site['refund']>;
};

const { id, heading: defaultHeading } = EVENT_SECTIONS.refund;

/** Есть ли что показать в блоке возврата: сроки, почта кассы или текст правил. */
export const hasRefund = ({ terms, email, body }: NonNullable<Site['refund']>) =>
  Boolean(terms?.length || email?.trim() || paragraphs(body).length);

/**
 * Возврат билета — инструкция кассы Radario, в которую ведут кнопки билета: сроки и сколько вернут таблицей, как
 * вернуть (письмо в кассу и что в нем указать), полный текст правил под раскрытием. Нет части в CMS — нет и части.
 */
export const Refund = ({ refund }: RefundProps) => {
  const terms = refund.terms ?? [];
  const details = refund.details ?? [];
  const email = refund.email?.trim();
  const body = paragraphs(refund.body);
  const heading = refund.title?.trim() || defaultHeading;

  return (
    <Split
      id={id}
      labelledBy={`${id}-title`}
      rail={
        <>
          <RunicText size="kicker">{EVENT_KICKERS.refund}</RunicText>
          <h2
            className={shared.title}
            id={`${id}-title`}
          >
            {typograph(heading)}
          </h2>
          <p>{REFUND_TEXT}</p>
        </>
      }
    >
      <div className={shared.stack}>
        {terms.length ? (
          <table className={styles.terms}>
            <thead>
              <tr>
                <th scope="col">{REFUND_TERMS_HEAD.when}</th>
                <th scope="col">{REFUND_TERMS_HEAD.share}</th>
              </tr>
            </thead>
            <tbody>
              {terms.map((term) => (
                <tr key={term.id ?? term.when}>
                  <th scope="row">{typograph(term.when)}</th>
                  <td>{typograph(term.share)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {email ? (
          <CutBox className={shared.panel}>
            <h3 className={`${shared.caps} ${shared.label}`}>{REFUND_HOW}</h3>
            <p className={styles.text}>
              {REFUND_MAIL.before}
              <a
                className={styles.link}
                href={`mailto:${email}`}
              >
                {email}
              </a>
              {details.length ? REFUND_MAIL.withDetails : REFUND_MAIL.bare}
            </p>
            {details.length ? (
              <ul className={shared.facts}>
                {details.map((item) => (
                  <li key={item.id ?? item.text}>{typograph(item.text)}</li>
                ))}
              </ul>
            ) : null}
          </CutBox>
        ) : null}

        {body.length ? (
          <details className={styles.full}>
            <summary className={styles.summary}>
              {REFUND_FULL_TEXT}
              <Icon
                name="down"
                className={styles.icon}
              />
            </summary>
            <div className={`${shared.prose} ${styles.prose}`}>
              {body.map((text, index) => (
                <p key={index}>{text}</p>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </Split>
  );
};

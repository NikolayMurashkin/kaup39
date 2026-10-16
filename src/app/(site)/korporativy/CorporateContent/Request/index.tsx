import { LeadForm } from '@/components/LeadForm';
import { Split } from '@/components/Split';
import { CORPORATE_HEADINGS, CORPORATE_KICKERS, REQUEST_ANCHOR } from '../../consts';
import type { CorporateParts } from '../../types';
import { Rail } from '../Rail';
import styles from './Request.module.scss';

export type RequestProps = {
  request: CorporateParts['request'];
  /** Телефон владельцев: рядом с формой и в сообщении об успехе — для настоящего заказа. */
  phone: string;
};

/** Заявка: в рейке заголовок и текст раздела заявки, в поле форма с плашкой демо. Раздел есть всегда. */
export const Request = ({ request, phone }: RequestProps) => {
  const anchor = request?.anchor ?? REQUEST_ANCHOR;
  const titleId = `${anchor}-title`;

  return (
    <Split
      id={anchor}
      labelledBy={titleId}
      className={styles.request}
      rail={
        <Rail
          kicker={CORPORATE_KICKERS.request}
          heading={request?.heading?.trim() || CORPORATE_HEADINGS.request}
          titleId={titleId}
          text={request?.body}
        />
      }
    >
      <LeadForm phone={phone} />
    </Split>
  );
};

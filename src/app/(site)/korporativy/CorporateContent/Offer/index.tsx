import { Split } from '@/components/Split';
import { paragraphs, typograph } from '@/lib/format';
import { CORPORATE_HEADINGS, CORPORATE_KICKERS } from '../../consts';
import type { CorporateParts } from '../../types';
import shared from '../CorporateContent.module.scss';
import { Rail } from '../Rail';
import styles from './Offer.module.scss';

export type OfferProps = {
  /** Подзаголовок страницы: чем Длинный дом лучше ресторана. */
  lead: string[];
  newYear: CorporateParts['newYear'];
};

/** Оффер: подзаголовок страницы крупно и карточка новогоднего корпоратива. */
export const Offer = ({ lead, newYear }: OfferProps) => {
  const body = paragraphs(newYear?.body);

  return (
    <Split
      id="offer"
      labelledBy="offer-title"
      rail={
        <Rail
          kicker={CORPORATE_KICKERS.offer}
          heading={CORPORATE_HEADINGS.offer}
          titleId="offer-title"
        />
      }
    >
      <div className={styles.stack}>
        {lead.length ? (
          <div className={`${shared.prose} ${styles.lead}`}>
            {lead.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : null}

        {newYear ? (
          <div
            className={shared.card}
            id={newYear.anchor ?? undefined}
          >
            {newYear.heading ? <h3>{typograph(newYear.heading)}</h3> : null}
            {body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : null}
      </div>
    </Split>
  );
};

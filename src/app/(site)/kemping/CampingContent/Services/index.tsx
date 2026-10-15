import { RunicText } from '@/components/RunicText';
import { Split } from '@/components/Split';
import { paragraphs, typograph } from '@/lib/format';
import { CAMPING_KICKERS } from '../../consts';
import type { CampingParts } from '../../types';
import shared from '../CampingContent.module.scss';
import styles from './Services.module.scss';

export type ServicesProps = {
  services: NonNullable<CampingParts['services']>;
};

/**
 * Услуги в кемпинге: пункты сеткой, у каждого пояснение, если оно есть. Пункт со ссылкой из CMS ведет на чужой сайт
 * в новой вкладке: валидатор пропускает только полный https-адрес.
 */
export const Services = ({ services }: ServicesProps) => {
  const titleId = `${services.anchor}-title`;

  return (
    <Split
      id={services.anchor ?? undefined}
      labelledBy={services.heading ? titleId : undefined}
      rail={
        <>
          <RunicText size="kicker">{CAMPING_KICKERS.services}</RunicText>
          {services.heading ? (
            <h2
              className={shared.title}
              id={titleId}
            >
              {typograph(services.heading)}
            </h2>
          ) : null}
          {paragraphs(services.intro).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </>
      }
    >
      <ul className={styles.services}>
        {(services.items ?? []).map((item) => (
          <li key={item.id ?? item.title}>
            <b>
              {item.url ? (
                <a
                  className={styles.link}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {typograph(item.title)}
                </a>
              ) : (
                typograph(item.title)
              )}
            </b>
            {item.text ? <span>{typograph(item.text)}</span> : null}
          </li>
        ))}
      </ul>

      {paragraphs(services.footnote).map((note) => (
        <p
          key={note}
          className={shared.footnote}
        >
          {note}
        </p>
      ))}
    </Split>
  );
};

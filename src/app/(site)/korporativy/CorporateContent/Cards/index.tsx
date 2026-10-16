import { Split } from '@/components/Split';
import type { PageSection } from '@/cms/types';
import { typograph } from '@/lib/format';
import shared from '../CorporateContent.module.scss';
import { Rail } from '../Rail';
import styles from './Cards.module.scss';

export type CardsProps = {
  list: Extract<PageSection, { blockType: 'list' }>;
  kicker: string;
};

/**
 * Раздел-список карточками: огненное шоу, питание. В рейке заголовок и вступление, в поле карточка на пункт.
 * Пункт со ссылкой из CMS ведет на чужой сайт в новой вкладке: валидатор пропускает только полный https-адрес.
 */
export const Cards = ({ list, kicker }: CardsProps) => {
  const titleId = `${list.anchor}-title`;
  const heading = list.heading?.trim();

  return (
    <Split
      id={list.anchor ?? undefined}
      labelledBy={heading ? titleId : undefined}
      rail={
        heading ? (
          <Rail
            kicker={kicker}
            heading={heading}
            titleId={titleId}
            text={list.intro}
          />
        ) : null
      }
    >
      <ul className={styles.cards}>
        {(list.items ?? []).map((item) => (
          <li
            key={item.id ?? item.title}
            className={shared.card}
          >
            <h3>
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
            </h3>
            {item.text ? <p>{typograph(item.text)}</p> : null}
          </li>
        ))}
      </ul>
    </Split>
  );
};

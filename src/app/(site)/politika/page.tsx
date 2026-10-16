import { Fragment } from 'react';
import { MoreLink } from '@/components/MoreLink';
import { PageHead } from '@/components/PageHead';
import { Section } from '@/components/Section';
import { CORPORATE_PATH } from '@/lib/consts';
import { typograph } from '@/lib/format';
import { REQUEST_ANCHOR } from '../korporativy/consts';
import {
  BACK_LINK,
  POLICY_EMAIL,
  POLICY_KICKER,
  POLICY_LEAD,
  POLICY_SECTIONS,
  POLICY_TITLE,
  POLICY_UPDATED,
} from './consts';
import styles from './page.module.scss';

/** Строка политики, где адрес студии — ссылкой на письмо. */
const withEmail = (text: string) =>
  typograph(text)
    .split(POLICY_EMAIL)
    .map((part, index) => (
      <Fragment key={`${index}-${part}`}>
        {index ? <a href={`mailto:${POLICY_EMAIL}`}>{POLICY_EMAIL}</a> : null}
        {part}
      </Fragment>
    ));

/** Политика обработки персональных данных формы заявки: оператор, данные, каналы, хранение, права. */
const PolicyPage = () => (
  <>
    <PageHead
      kicker={POLICY_KICKER}
      title={typograph(POLICY_TITLE)}
      lead={typograph(POLICY_LEAD)}
      facts={
        <div className={styles.facts}>
          <p className={styles.updated}>{typograph(POLICY_UPDATED)}</p>
        </div>
      }
    />

    <Section>
      <div className={styles.policy}>
        {POLICY_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-title`}
            className={styles.part}
          >
            <h2 id={`${section.id}-title`}>{typograph(section.title)}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{withEmail(paragraph)}</p>
            ))}
            {section.items ? (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{withEmail(item)}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <MoreLink href={`${CORPORATE_PATH}#${REQUEST_ANCHOR}`}>{BACK_LINK}</MoreLink>
      </div>
    </Section>
  </>
);

export default PolicyPage;

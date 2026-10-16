import { Split } from '@/components/Split';
import { typograph } from '@/lib/format';
import { CORPORATE_KICKERS, CORPORATE_PARTS } from '../../consts';
import type { CorporateParts } from '../../types';
import { Rail } from '../Rail';
import styles from './Formats.module.scss';

export type FormatsProps = {
  formats: NonNullable<CorporateParts['formats']>;
};

/** Что можно провести: поводы списком с номером, у пункта — пояснение, если оно есть. */
export const Formats = ({ formats }: FormatsProps) => {
  const anchor = formats.anchor ?? CORPORATE_PARTS.formats.anchor;
  const titleId = `${anchor}-title`;
  const heading = formats.heading?.trim();

  return (
    <Split
      id={anchor}
      labelledBy={heading ? titleId : undefined}
      rail={
        heading ? (
          <Rail
            kicker={CORPORATE_KICKERS.formats}
            heading={heading}
            titleId={titleId}
            text={formats.intro}
          />
        ) : null
      }
    >
      <ol className={styles.formats}>
        {(formats.items ?? []).map((item, index) => (
          <li key={item.id ?? item.title}>
            <small aria-hidden="true">{String(index + 1).padStart(2, '0')}</small>
            <span>
              <b>{typograph(item.title)}</b>
              {item.text ? <span>{typograph(item.text)}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </Split>
  );
};

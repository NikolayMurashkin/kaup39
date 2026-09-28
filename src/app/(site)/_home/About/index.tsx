import { RunicText } from '@/components/RunicText';
import { Split } from '@/components/Split';
import { paragraphs, typograph } from '@/lib/format';
import { KICKERS } from '../consts';
import styles from './About.module.scss';

export type AboutProps = {
  anchor: string;
  heading: string;
  body?: string | null;
  /** Адрес поселения из глобала «Сайт» — подпись под заголовком. */
  address: string;
};

/** «О поселении» по артборду v2: заголовок и адрес в рейке, текст владельцев колонками в поле. */
export const About = ({ anchor, heading, body, address }: AboutProps) => (
  <Split
    id={anchor}
    labelledBy={`${anchor}-title`}
    rail={
      <>
        <RunicText size="kicker">{KICKERS.about}</RunicText>
        <h2
          className={styles.title}
          id={`${anchor}-title`}
        >
          {typograph(heading)}
        </h2>
        <p className={styles.address}>{typograph(address)}</p>
      </>
    }
  >
    <div className={styles.columns}>
      {paragraphs(body).map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  </Split>
);

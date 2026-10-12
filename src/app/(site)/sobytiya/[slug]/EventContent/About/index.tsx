import { RunicText } from '@/components/RunicText';
import { Split } from '@/components/Split';
import { typograph } from '@/lib/format';
import { EVENT_KICKERS, EVENT_SECTIONS } from '../../consts';
import shared from '../EventContent.module.scss';
import styles from './About.module.scss';

export type AboutProps = {
  /** Абзацы описания из CMS: первый — крупнее, как вступление. */
  paragraphs: string[];
  /** Имя поселения под заголовком. */
  place: string;
};

const { id, heading } = EVENT_SECTIONS.about;

/** «О событии»: описание из CMS абзацами, в рейке — заголовок и имя поселения. */
export const About = ({ paragraphs, place }: AboutProps) => (
  <Split
    id={id}
    labelledBy={`${id}-title`}
    rail={
      <>
        <RunicText size="kicker">{EVENT_KICKERS.about}</RunicText>
        <h2
          className={shared.title}
          id={`${id}-title`}
        >
          {heading}
        </h2>
        <p className={shared.caps}>{typograph(place)}</p>
      </>
    }
  >
    <div className={`${shared.prose} ${styles.lead}`}>
      {paragraphs.map((text, index) => (
        <p key={index}>{text}</p>
      ))}
    </div>
  </Split>
);

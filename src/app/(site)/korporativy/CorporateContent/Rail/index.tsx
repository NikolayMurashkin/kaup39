import { RunicText } from '@/components/RunicText';
import { paragraphs, typograph } from '@/lib/format';
import shared from '../CorporateContent.module.scss';

export type RailProps = {
  kicker: string;
  heading: string;
  titleId: string;
  /** Короткий текст под заголовком: абзацы из CMS. */
  text?: string | null;
};

/** Рейка раздела: руны, заголовок и короткий текст из CMS. */
export const Rail = ({ kicker, heading, titleId, text }: RailProps) => (
  <>
    <RunicText size="kicker">{kicker}</RunicText>
    <h2
      className={shared.title}
      id={titleId}
    >
      {typograph(heading)}
    </h2>
    {paragraphs(text).map((paragraph) => (
      <p
        key={paragraph}
        className={shared.railText}
      >
        {paragraph}
      </p>
    ))}
  </>
);

import { MapEmbed } from '@/components/MapEmbed';
import type { MapPoint } from '@/components/MapEmbed/types';
import { MoreLink } from '@/components/MoreLink';
import { RunicText } from '@/components/RunicText';
import { Section } from '@/components/Section';
import { Split } from '@/components/Split';
import { DIRECTIONS_PATH } from '@/lib/consts';
import { typograph } from '@/lib/format';
import { EVENT_KICKERS, EVENT_SECTIONS, WAY_LINK } from '../../consts';
import shared from '../EventContent.module.scss';
import styles from './Way.module.scss';

export type WayProps = {
  address: string;
  /** Точка поселения: нет ее — нет и карты, адрес и ссылка на «Как доехать» остаются. */
  map: MapPoint | null;
  place: string;
};

const { id, heading } = EVENT_SECTIONS.way;

/** «Как добраться»: адрес, ссылка на страницу «Как доехать» и карта, которая грузится по клику. */
export const Way = ({ address, map, place }: WayProps) => {
  const rail = (
    <>
      <RunicText size="kicker">{EVENT_KICKERS.way}</RunicText>
      <h2
        className={shared.title}
        id={`${id}-title`}
      >
        {heading}
      </h2>
      <p>{typograph(address)}</p>
      <MoreLink href={DIRECTIONS_PATH}>{WAY_LINK}</MoreLink>
    </>
  );

  if (!map) {
    return (
      <Section
        id={id}
        labelledBy={`${id}-title`}
      >
        <div className={styles.text}>{rail}</div>
      </Section>
    );
  }

  return (
    <Split
      id={id}
      labelledBy={`${id}-title`}
      rail={rail}
    >
      <MapEmbed
        point={map}
        label={`Карта: ${address}`}
        address={typograph(address)}
        place={place}
      />
    </Split>
  );
};

import { CmsSections } from '@/components/CmsSections';
import { MapEmbed } from '@/components/MapEmbed';
import { PageHead } from '@/components/PageHead';
import { Section } from '@/components/Section';
import { typograph } from '@/lib/format';
import { DIRECTIONS_KICKERS } from '../consts';
import type { DirectionsParts } from '../types';
import { Bus } from './Bus';
import { Car } from './Car';
import styles from './DirectionsContent.module.scss';
import { Routes } from './Routes';
import { Transfer } from './Transfer';

export type DirectionsContentProps = {
  title: string;
  lead: string | null;
  address: string;
  /** Точка поселения: нет ее — нет и карты. */
  map: { latitude: number; longitude: number } | null;
  parts: DirectionsParts;
  /** Имя места для подписи карты: «поселение «Кауп» на карте». */
  place?: string | null;
};

/**
 * Страница «как доехать» по артборду v2: первый экран с адресом, маршрутами на картах и картой по клику, трансфер
 * с точками сбора, ценой и правилами, парковка, рейсовые автобусы и разделы, которых код не знает. Заголовки и
 * подписи частей приходят из CMS; нет раздела — нет части.
 */
export const DirectionsContent = ({ title, lead, address, map, parts, place }: DirectionsContentProps) => (
  <>
    <PageHead
      kicker={DIRECTIONS_KICKERS.head}
      title={typograph(title)}
      lead={lead ? typograph(lead) : null}
      facts={
        <>
          <p className={styles.address}>
            <span className={styles.caps}>адрес</span>
            <span>{typograph(address)}</span>
          </p>
          <Routes maps={parts.maps} />
        </>
      }
      aside={
        map ? (
          <MapEmbed
            point={map}
            label={`Карта: ${address}`}
            address={typograph(address)}
            place={place}
          />
        ) : null
      }
    />

    <Transfer parts={parts} />
    {parts.car ? <Car car={parts.car} /> : null}
    {parts.bus ? <Bus bus={parts.bus} /> : null}

    {parts.rest.length ? (
      <Section>
        <CmsSections sections={parts.rest} />
      </Section>
    ) : null}
  </>
);

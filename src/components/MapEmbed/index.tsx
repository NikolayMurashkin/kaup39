'use client';

import { useState } from 'react';
import { typograph } from '@/lib/format';
import { Button } from '../Button';
import { CutBox } from '../CutBox';
import { Icon } from '../Icon';
import { Ornament } from '../Ornament';
import { MAP_WIDGET_URL, MAP_ZOOM, QUOTED_NAME } from './consts';
import styles from './MapEmbed.module.scss';
import type { MapPoint } from './types';

export type MapEmbedProps = {
  point: MapPoint;
  /** Подпись карты для скринридера и заголовок iframe: что на ней отмечено. */
  label: string;
  /** Адрес под значком до клика: что и где будет на карте. */
  address: string;
  /** Имя места в подписи над адресом: «поселение «Кауп» на карте». Нет имени — подпись без него. */
  place?: string | null;
};

const widgetUrl = ({ latitude, longitude }: MapPoint) => {
  const point = `${longitude},${latitude}`;

  return `${MAP_WIDGET_URL}?${new URLSearchParams({ ll: point, z: String(MAP_ZOOM), pt: `${point},pm2rdm` })}`;
};

/** Имя места в кавычках: из «Поселение эпохи викингов «Кауп»» — «Кауп», имя без кавычек — целиком. */
const placeName = (place: string) => QUOTED_NAME.exec(place)?.[1]?.trim() || place;

const caption = (place?: string | null) => {
  const name = place?.trim();

  return typograph(name ? `поселение «${placeName(name)}» на карте` : 'поселение на карте');
};

/**
 * Карта грузится по клику, а не при открытии страницы: виджет Яндекса тянет за собой скрипты и тайлы, и до клика
 * страница не делает к нему ни одного запроса. До клика под лицевой частью лежит кольцевая цепь направления.
 */
export const MapEmbed = ({ point, label, address, place }: MapEmbedProps) => {
  const [shown, setShown] = useState(false);

  return (
    <CutBox
      surface="steel"
      className={styles.map}
    >
      <div
        className={styles.frame}
        data-map
      >
        {shown ? (
          <iframe
            className={styles.widget}
            src={widgetUrl(point)}
            title={label}
            allowFullScreen
          />
        ) : (
          <>
            <Ornament className={styles.pattern} />
            <CutBox
              cut="sm"
              surface="steel"
              className={styles.face}
            >
              <Icon
                name="pin"
                className={styles.pin}
              />
              <p className={styles.caps}>{caption(place)}</p>
              <p className={styles.address}>{address}</p>
              <Button
                kind="ghost"
                size="sm"
                className={styles.open}
                onClick={() => setShown(true)}
              >
                Показать карту
              </Button>
            </CutBox>
          </>
        )}
      </div>
    </CutBox>
  );
};

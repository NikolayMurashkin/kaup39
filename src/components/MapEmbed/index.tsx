'use client';

import { useState } from 'react';
import { Button } from '../Button';
import { CutBox } from '../CutBox';
import { MAP_WIDGET_URL, MAP_ZOOM } from './consts';
import styles from './MapEmbed.module.scss';
import type { MapPoint } from './types';

export type MapEmbedProps = {
  point: MapPoint;
  /** Подпись карты для скринридера и заголовок iframe: что на ней отмечено. */
  label: string;
};

const widgetUrl = ({ latitude, longitude }: MapPoint) => {
  const point = `${longitude},${latitude}`;

  return `${MAP_WIDGET_URL}?${new URLSearchParams({ ll: point, z: String(MAP_ZOOM), pt: `${point},pm2rdm` })}`;
};

/**
 * Карта грузится по клику, а не при открытии страницы: виджет Яндекса тянет за собой скрипты и тайлы, и до клика
 * страница не делает к нему ни одного запроса.
 */
export const MapEmbed = ({ point, label }: MapEmbedProps) => {
  const [shown, setShown] = useState(false);

  return (
    <CutBox
      cut="sm"
      surface="raised"
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
          <Button
            kind="ghost"
            onClick={() => setShown(true)}
          >
            Показать карту
          </Button>
        )}
      </div>
    </CutBox>
  );
};

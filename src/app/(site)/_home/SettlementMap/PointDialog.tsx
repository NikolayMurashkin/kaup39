import Image from 'next/image';
import type { ReactNode } from 'react';
import { toPhoto } from '@/cms/photo';
import { Dialog } from '@/components/Dialog';
import { PhotoNote } from '@/components/PhotoNote';
import { typograph } from '@/lib/format';
import type { MapPoint, Tavern, Zone } from '@/payload-types';
import { TavernDialog } from '../Kitchen/TavernDialog';
import { ZoneDialog } from '../Zones/ZoneDialog';
import { POINT_DIALOG_SIZES } from './consts';
import { dotNumber, pointPlace } from './points';
import styles from './SettlementMap.module.scss';

export type PointDialogProps = {
  point: MapPoint;
  zones: Zone[];
  taverns: Tavern[];
  trigger: ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
};

/**
 * Окно точки карты: у точки со связью — окно ее площадки или таверны, как у карточки на главной; у остальных — свое:
 * кадр места с подписью автора, если он есть, и название.
 */
export const PointDialog = ({ point, zones, taverns, trigger, triggerClassName, triggerLabel }: PointDialogProps) => {
  const place = pointPlace(point, zones, taverns);
  const button = { trigger, triggerClassName, triggerLabel };

  if (place?.kind === 'zone') {
    return (
      <ZoneDialog
        zone={place.zone}
        {...button}
      />
    );
  }

  if (place?.kind === 'tavern') {
    return (
      <TavernDialog
        tavern={place.tavern}
        {...button}
      />
    );
  }

  const photo = toPhoto(point.photo);

  return (
    <Dialog
      label={point.name}
      heading={<p className={styles.dialogCaps}>Точка {dotNumber(point.number)}</p>}
      {...button}
    >
      {photo ? (
        <figure className={styles.dialogFigure}>
          <div className={styles.dialogMedia}>
            <Image
              className={styles.image}
              src={photo.src}
              alt={photo.alt}
              sizes={POINT_DIALOG_SIZES}
              fill
            />
            {photo.temporary ? <PhotoNote /> : null}
          </div>
          {photo.author ? <figcaption className={styles.author}>Фото: {photo.author}</figcaption> : null}
        </figure>
      ) : null}

      <h2 className={styles.dialogTitle}>{typograph(point.name)}</h2>
    </Dialog>
  );
};

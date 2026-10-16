import type { ReactNode } from 'react';
import { toPhoto } from '@/cms/photo';
import type { Photo } from '@/cms/types';
import { Button } from '@/components/Button';
import { PlaceCard } from '@/components/PlaceCard';
import { PlaceDialog } from '@/components/PlaceCard/PlaceDialog';
import { SCHEDULE_PATH } from '@/lib/consts';
import { paragraphs } from '@/lib/format';
import type { Zone } from '@/payload-types';
import { ZONE_ACTION } from '../consts';
import styles from './Zones.module.scss';

/** Кадр карточки площадки и кадры ее слайдера; удаленные из медиатеки пропускаются. */
const shotsOf = (zone: Zone) => ({
  photo: toPhoto(zone.photo),
  gallery: (zone.gallery ?? []).map(toPhoto).filter((shot): shot is Photo => shot !== null),
});

type ZoneTextProps = {
  zone: Zone;
};

/** Текст окна площадки: описание и ссылка на даты и цены. */
const ZoneText = ({ zone }: ZoneTextProps) => (
  <>
    {paragraphs(zone.description).map((paragraph) => (
      <p key={paragraph}>{paragraph}</p>
    ))}
    <Button
      kind="ghost"
      size="sm"
      href={SCHEDULE_PATH}
      className={styles.dates}
    >
      Даты и&nbsp;цены
    </Button>
  </>
);

export type ZoneCardProps = {
  zone: Zone;
};

/** Карточка площадки в разделе площадок: открывает окно площадки. */
export const ZoneCard = ({ zone }: ZoneCardProps) => (
  <PlaceCard
    name={zone.name}
    number={zone.order}
    mark={zone.mark ?? 'house'}
    action={ZONE_ACTION}
    {...shotsOf(zone)}
  >
    <ZoneText zone={zone} />
  </PlaceCard>
);

export type ZoneDialogProps = {
  zone: Zone;
  trigger: ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
};

/** То же окно площадки, что у карточки, со своей кнопкой — для точки карты поселения. */
export const ZoneDialog = ({ zone, trigger, triggerClassName, triggerLabel }: ZoneDialogProps) => (
  <PlaceDialog
    name={zone.name}
    mark={zone.mark ?? 'house'}
    action={ZONE_ACTION}
    trigger={trigger}
    triggerClassName={triggerClassName}
    triggerLabel={triggerLabel}
    {...shotsOf(zone)}
  >
    <ZoneText zone={zone} />
  </PlaceDialog>
);

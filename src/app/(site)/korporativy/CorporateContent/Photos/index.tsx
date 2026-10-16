import { toPhoto } from '@/cms/photo';
import type { Photo } from '@/cms/types';
import { PhotoViewer } from '@/components/PhotoViewer';
import { RunicText } from '@/components/RunicText';
import { Section } from '@/components/Section';
import { plural, typograph } from '@/lib/format';
import { SHOTS_FORMS } from '@/app/(site)/_home/consts';
import { CORPORATE_HEADINGS, CORPORATE_KICKERS, OWNERS_SHOTS, SHOT_SIZES } from '../../consts';
import type { CorporateParts } from '../../types';
import shared from '../CorporateContent.module.scss';
import styles from './Photos.module.scss';

export type PhotosProps = {
  photos: NonNullable<CorporateParts['photos']>;
};

/**
 * Фото мероприятий: кадры в ряд, кадр открывает общий просмотр со слайдером; временный чужой кадр подписан
 * «фото для примера». Над кадрами — их число, «кадров владельцев», только если временного среди них нет. Кадров нет
 * (все удалены из медиатеки) — нет и раздела.
 */
export const Photos = ({ photos }: PhotosProps) => {
  const shots = (photos.photos ?? []).map(toPhoto).filter((shot): shot is Photo => shot !== null);

  if (!shots.length) {
    return null;
  }

  const heading = photos.heading?.trim() || CORPORATE_HEADINGS.photos;
  const titleId = `${photos.anchor}-title`;

  return (
    <Section
      id={photos.anchor ?? undefined}
      labelledBy={titleId}
      className={styles.photos}
    >
      <div className={styles.head}>
        <div className={styles.heading}>
          <RunicText size="kicker">{CORPORATE_KICKERS.photos}</RunicText>
          <h2
            className={shared.title}
            id={titleId}
          >
            {typograph(heading)}
          </h2>
        </div>
        <p className={shared.caps}>
          {shots.length}&nbsp;{plural(shots.length, SHOTS_FORMS)}
          {shots.some((shot) => shot.temporary) ? null : ` ${OWNERS_SHOTS}`}
        </p>
      </div>

      <PhotoViewer
        label={heading}
        photos={shots}
        className={styles.slots}
        itemSizes={shots.map(() => SHOT_SIZES)}
      />
    </Section>
  );
};

import { toPhoto } from '@/cms/photo';
import type { Photo } from '@/cms/types';
import { PhotoViewer } from '@/components/PhotoViewer';
import { RunicText } from '@/components/RunicText';
import { Section } from '@/components/Section';
import { plural, typograph } from '@/lib/format';
import { SHOTS_FORMS } from '@/app/(site)/_home/consts';
import { CAMPING_HEADINGS, CAMPING_KICKERS, SHOT_SIZES } from '../../consts';
import type { CampingParts } from '../../types';
import shared from '../CampingContent.module.scss';
import styles from './Photos.module.scss';

export type PhotosProps = {
  photos: NonNullable<CampingParts['photos']>;
};

/**
 * Фото кемпинга: кадры в ряд, кадр открывает общий просмотр со слайдером и подписью «Фото: <автор>» — автор кадра
 * виден только в просмотре. Кадров нет (все удалены из медиатеки) — нет и раздела.
 */
export const Photos = ({ photos }: PhotosProps) => {
  const shots = (photos.photos ?? []).map(toPhoto).filter((shot): shot is Photo => shot !== null);

  if (!shots.length) {
    return null;
  }

  const heading = photos.heading?.trim() || CAMPING_HEADINGS.photos;
  const titleId = `${photos.anchor}-title`;

  return (
    <Section
      id={photos.anchor ?? undefined}
      labelledBy={titleId}
      className={styles.photos}
    >
      <div className={styles.head}>
        <div className={styles.heading}>
          <RunicText size="kicker">{CAMPING_KICKERS.photos}</RunicText>
          <h2
            className={shared.title}
            id={titleId}
          >
            {typograph(heading)}
          </h2>
        </div>
        <p className={shared.caps}>
          {shots.length}&nbsp;{plural(shots.length, SHOTS_FORMS)}
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

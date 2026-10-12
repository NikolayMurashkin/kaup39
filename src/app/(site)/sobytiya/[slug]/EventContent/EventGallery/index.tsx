import type { Photo } from '@/cms/types';
import { PhotoViewer } from '@/components/PhotoViewer';
import { RunicText } from '@/components/RunicText';
import { Section } from '@/components/Section';
import { plural } from '@/lib/format';
import { mosaicPlan } from '@/app/(site)/_home/cards';
import { SHOTS_FORMS } from '@/app/(site)/_home/consts';
import { EVENT_KICKERS, EVENT_SECTIONS } from '../../consts';
import shared from '../EventContent.module.scss';
import styles from './EventGallery.module.scss';

export type EventGalleryProps = {
  photos: Photo[];
};

const { id, heading } = EVENT_SECTIONS.gallery;

/**
 * «Фото с события»: мозаика главной (клетки по ориентации кадров, `mosaicPlan`), кадр открывает общий просмотр
 * со слайдером и подписью «Фото: <автор>»: автор кадра виден только в просмотре.
 */
export const EventGallery = ({ photos }: EventGalleryProps) => {
  const plan = mosaicPlan(photos);

  return (
    <Section
      id={id}
      labelledBy={`${id}-title`}
      className={styles.gallery}
    >
      <div className={styles.head}>
        <div className={styles.heading}>
          <RunicText size="kicker">{EVENT_KICKERS.gallery}</RunicText>
          <h2
            className={shared.title}
            id={`${id}-title`}
          >
            {heading}
          </h2>
        </div>
        <p className={shared.caps}>
          {photos.length}&nbsp;{plural(photos.length, SHOTS_FORMS)}
        </p>
      </div>

      <PhotoViewer
        label={heading}
        photos={plan.map(({ photo }) => photo)}
        className={styles.mosaic}
        itemClassNames={plan.map(({ size }) => (size ? styles[size] : ''))}
        itemSizes={plan.map(({ sizes }) => sizes)}
      />
    </Section>
  );
};

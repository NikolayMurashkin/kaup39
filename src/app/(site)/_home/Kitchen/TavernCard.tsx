import Image from 'next/image';
import { toPhoto } from '@/cms/photo';
import { Icon } from '@/components/Icon';
import { typograph } from '@/lib/format';
import type { Tavern } from '@/payload-types';
import { tavernSummary } from '../cards';
import { TAVERN_THUMB_SIZES } from '../consts';
import styles from './Kitchen.module.scss';
import { TavernDialog } from './TavernDialog';

export type TavernCardProps = {
  tavern: Tavern;
};

/**
 * Строка таверны на главной — кнопка; диалог показывает кадр, описание и меню с ценами из CMS. Миниатюра в кнопке
 * декоративная: описание кадра стоит у него в диалоге, а в имени кнопки было бы лишним.
 */
export const TavernCard = ({ tavern }: TavernCardProps) => {
  const photo = toPhoto(tavern.photo);
  const summary = tavernSummary(tavern);
  const hasMenu = (tavern.menu ?? []).some((part) => part.items?.length);

  return (
    <TavernDialog
      tavern={tavern}
      triggerClassName={[styles.tavern, photo ? styles.withPhoto : null].filter(Boolean).join(' ')}
      trigger={
        <>
          {photo ? (
            <span className={styles.thumb}>
              <Image
                className={styles.image}
                src={photo.src}
                alt=""
                sizes={TAVERN_THUMB_SIZES}
                fill
              />
            </span>
          ) : null}
          <span className={styles.name}>{typograph(tavern.name)}</span>
          {summary ? <span className={styles.meta}>{summary}</span> : null}
          <span className={styles.go}>
            {hasMenu ? 'Меню' : 'Подробнее'}
            <Icon
              name="arrow"
              className={styles.goIcon}
            />
          </span>
        </>
      }
    />
  );
};

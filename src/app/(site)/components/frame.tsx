import type { Photo } from '@/cms/types';
import { Dialog } from '@/components/Dialog';
import { FirstScreen } from '@/components/FirstScreen';
import { PhotoViewer } from '@/components/PhotoViewer';
import { PlaceCard } from '@/components/PlaceCard';
import { RunicText } from '@/components/RunicText';
import { Split } from '@/components/Split';
import { SCHEDULE_PATH } from '@/lib/consts';
import { SAMPLE_NEXT, SAMPLE_PHONE } from './consts';
import styles from './page.module.scss';
import type { ShowcaseSection } from './types';

/** Витрина показывает, как выглядит временный кадр (D31): второй образец помечен временным. */
const asTemporary = (photo: Photo | undefined) => (photo ? { ...photo, temporary: true } : null);

/**
 * Каркас v2 на витрине: сетка «рейка — поле», карточки с кадром и без, диалог, просмотр фото и первый экран.
 * Кадры — первые файлы медиатеки: оптимизатор картинок отдает только их.
 */
export const frameSections = (photos: Photo[]): ShowcaseSection[] => [
  {
    id: 'split',
    name: 'Сетка: рейка и поле',
    note: 'Рейка 340\u00a0px с\u00a0подписью, заголовком и\u00a0ссылкой липнет под\u00a0шапкой, пока полю остается не\u00a0меньше 600\u00a0px; уже\u00a0— встает над\u00a0полем.',
    view: (
      <Split
        className={styles.split}
        rail={
          <>
            <RunicText size="mark">Кауп</RunicText>
            <h2 className={styles.name}>Площадки</h2>
            <p>Короткий текст рейки не&nbsp;шире меры 34em: это&nbsp;60–70 знаков в&nbsp;строке.</p>
          </>
        }
      >
        <div className={styles.places}>
          <PlaceCard
            name="Образец площадки с кадром"
            mark="ship"
            photo={photos[0]}
            action="Подробнее"
          >
            <p>Текст диалога приезжает из&nbsp;CMS и&nbsp;может оказаться длинным — он переносится внутри диалога.</p>
          </PlaceCard>
          <PlaceCard
            name="Образец площадки без кадра"
            number={2}
            mark="forge"
            action="Подробнее"
          >
            <p>Карточка без&nbsp;кадра — полноценный вариант: знак площадки крупно, номер и&nbsp;название.</p>
          </PlaceCard>
          <PlaceCard
            name="Временный кадр"
            number={3}
            mark="bow"
            photo={asTemporary(photos[1])}
            action="Подробнее"
          >
            <p>Чужой кадр на&nbsp;месте, для&nbsp;которого нет своего, подписан «фото для&nbsp;примера».</p>
          </PlaceCard>
          <PlaceCard
            name="Еще одна площадка без кадра"
            number={4}
            mark="shield"
            action="Подробнее"
          >
            <p>Короткий текст.</p>
          </PlaceCard>
          <PlaceCard
            name="Площадка"
            number={5}
            mark="hall"
            action="Подробнее"
          >
            <p>Короткое название.</p>
          </PlaceCard>
          <PlaceCard
            name="Таверна"
            number={6}
            mark="pot"
            action="Меню"
          >
            <p>Строка действия у&nbsp;таверны — «Меню».</p>
          </PlaceCard>
        </div>
      </Split>
    ),
  },
  {
    id: 'dialog',
    name: 'Диалог',
    note: 'Нативный dialog: фокус внутрь, Esc и\u00a0крестик закрывают, клик по\u00a0затемнению тоже, фокус возвращается на\u00a0кнопку. На\u00a0телефоне — лист снизу.',
    view: (
      <Dialog
        label="Образец диалога"
        triggerClassName={styles.dialogTrigger}
        trigger="Открыть диалог"
        heading={<p className={styles.caps}>Образец</p>}
      >
        <h2 className={styles.name}>Образец диалога</h2>
        <p className={styles.note}>
          Длинный текст листается внутри диалога, шапка с крестиком липнет сверху. Мера текста та же, что на странице.
        </p>
      </Dialog>
    ),
  },
  {
    id: 'viewer',
    name: 'Просмотр фото',
    note: 'Кадр целиком, без\u00a0обрезки и\u00a0не\u00a0больше собственного размера, подпись и\u00a0счетчик; кнопки и\u00a0стрелки клавиатуры листают по\u00a0кругу.',
    view: (
      <PhotoViewer
        label="Образец галереи"
        photos={photos.map((photo, index) => (index === 1 ? { ...photo, temporary: true } : photo))}
      />
    ),
  },
  {
    id: 'first-screen',
    name: 'Первый экран',
    note: 'Кадр виден, плашка только под\u00a0текстом. До\u00a01279 плашка компактнее: без\u00a0рун и\u00a0лида, не\u00a0шире 540\u00a0px. Кадр образца помечен временным.',
    view: (
      <FirstScreen
        photo={asTemporary(photos[1] ?? photos[0])}
        title="Образец заголовка первого экрана"
        lead="Лид первого экрана: на широком окне он стоит под заголовком, до 1279 его нет"
        runes="Эпоха викингов"
        credit="фото владельцев"
        next={SAMPLE_NEXT}
        scheduleHref={SCHEDULE_PATH}
        phone={SAMPLE_PHONE}
      />
    ),
  },
];

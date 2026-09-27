import type { Photo } from '@/cms/types';
import { Dialog } from '@/components/Dialog';
import { FirstScreen } from '@/components/FirstScreen';
import type { FirstScreenNext } from '@/components/FirstScreen/types';
import { PhotoViewer } from '@/components/PhotoViewer';
import { PlaceCard } from '@/components/PlaceCard';
import { RunicText } from '@/components/RunicText';
import { Split } from '@/components/Split';
import { SCHEDULE_PATH } from '@/lib/consts';
import styles from './page.module.scss';
import type { ShowcaseSection } from './types';

/** Ближайшая дата образца первого экрана: выдумана для витрины, как и остальные образцы. */
const SAMPLE_NEXT: FirstScreenNext = {
  dateTime: '2026-11-03',
  date: '3 ноября',
  details: 'вторник, 11:00 — 14:00 · Образец события',
  price: 850,
  ticketUrl: 'https://radario.ru/',
};

const SAMPLE_PHONE = '8 (4012) 00-00-00';

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
    note: 'Рейка 340 px с подписью, заголовком и ссылкой липнет под шапкой, пока полю остается не меньше 600 px; уже — встает над полем.',
    view: (
      <Split
        className={styles.split}
        rail={
          <>
            <RunicText size="mark">Кауп</RunicText>
            <h2 className={styles.name}>Площадки</h2>
            <p>Короткий текст рейки не шире меры 34em: это 60–70 знаков в строке.</p>
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
            <p>Текст диалога приезжает из CMS и может оказаться длинным — он переносится внутри диалога.</p>
          </PlaceCard>
          <PlaceCard
            name="Образец площадки без кадра"
            number={2}
            mark="forge"
            action="Подробнее"
          >
            <p>Карточка без кадра — полноценный вариант: знак площадки крупно, номер и название.</p>
          </PlaceCard>
          <PlaceCard
            name="Временный кадр"
            number={3}
            mark="bow"
            photo={asTemporary(photos[1])}
            action="Подробнее"
          >
            <p>Чужой кадр на месте, для которого нет своего, подписан «фото для примера».</p>
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
            <p>Строка действия у таверны — «Меню».</p>
          </PlaceCard>
        </div>
      </Split>
    ),
  },
  {
    id: 'dialog',
    name: 'Диалог',
    note: 'Нативный dialog: фокус внутрь, Esc и крестик закрывают, клик по затемнению тоже, фокус возвращается на кнопку. На телефоне — лист снизу.',
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
    note: 'Кадр целиком, без обрезки и не больше собственного размера, подпись и счетчик; кнопки и стрелки клавиатуры листают по кругу.',
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
    note: 'Кадр виден, плашка только под текстом. До 1279 плашка компактнее: без рун и лида, не шире 540 px. Кадр образца помечен временным.',
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

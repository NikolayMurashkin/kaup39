import { Button } from '@/components/Button';
import { CutBox } from '@/components/CutBox';
import { EventCard } from '@/components/EventCard';
import type { EventCardItem } from '@/components/EventCard/types';
import { Grain } from '@/components/Grain';
import { Ornament } from '@/components/Ornament';
import { PhotoSlot } from '@/components/PhotoSlot';
import { Price } from '@/components/Price';
import { RunicText } from '@/components/RunicText';
import { StonePanel } from '@/components/StonePanel';
import type { StonePanelEvent } from '@/components/StonePanel/types';
import styles from './page.module.scss';
import type { ShowcaseSection } from './types';

/**
 * Образцы витрины выдуманы для нее самой: ни названия, ни даты, ни цены не повторяют карточку
 * владельцев — их тексты живут в CMS на закрытом стенде и в репозиторий не попадают.
 */
const SAMPLE_EVENT: EventCardItem = {
  date: '3 ноября',
  time: '11:00 — 14:00',
  name: 'Образец события',
  note: 'Строка описания приезжает из CMS и может оказаться длинной — она переносится, а не вылезает за карточку.',
  price: '850',
  priceNote: 'взрослый билет',
  ticketUrl: 'https://radario.ru/',
};

const SAMPLE_EVENT_FROM: EventCardItem = {
  ...SAMPLE_EVENT,
  date: '17 ноября',
  time: '16:00 — 19:00',
  name: 'Образец события с ценой «от»',
  note: 'Короткое описание.',
  price: '450',
  pricePrefix: 'от',
  priceNote: 'детский билет',
};

const SAMPLE_PANEL_EVENT: StonePanelEvent = {
  date: '3 ноября, понедельник',
  time: '11:00 — 14:00',
  name: 'Образец события',
  price: '850',
  priceNote: 'взрослый билет',
  ticketUrl: 'https://radario.ru/',
  scheduleUrl: '/schedule',
  scheduleLabel: 'Все даты и цены',
};

export const SECTIONS: ShowcaseSection[] = [
  {
    id: 'runes',
    name: 'Рунические надписи',
    note: 'Заголовки первого экрана и секций. Строка приходит из CMS и перерисовывается знаками алфавита.',
    view: (
      <div className={styles.stack}>
        <RunicText size="mark">Кауп</RunicText>
        <RunicText size="hero">Живой день</RunicText>
        <RunicText>Зоны поселения</RunicText>
      </div>
    ),
  },
  {
    id: 'ornaments',
    name: 'Орнаменты',
    note: 'Кольцевая цепь борре: лентой под кадром и полосой вдоль края панели.',
    view: (
      <div className={styles.stack}>
        <Ornament />
        <div className={styles.vertical}>
          <Ornament direction="vertical" />
        </div>
      </div>
    ),
  },
  {
    id: 'grain',
    name: 'Текстуры',
    note: 'Волокно дерева и зерно железа считаются на лету, картинок нет.',
    view: (
      <div className={styles.row}>
        <CutBox
          cut="sm"
          surface="raised"
          className={styles.swatch}
        >
          <Grain kind="wood" />
          <span className={styles.swatchLabel}>Дерево</span>
        </CutBox>

        <CutBox
          cut="sm"
          surface="steel"
          className={styles.swatch}
        >
          <Grain kind="iron" />
          <span className={styles.swatchLabel}>Железо</span>
        </CutBox>
      </div>
    ),
  },
  {
    id: 'cuts',
    name: 'Срезы и тени',
    note: 'Тесаные углы задаются clip-path, тень идет через drop-shadow — по срезу, а не по прямоугольнику.',
    view: (
      <div className={styles.row}>
        <CutBox
          cut="sm"
          shadow="plate"
          className={styles.swatch}
        >
          <span className={styles.swatchLabel}>Малый срез</span>
        </CutBox>

        <CutBox
          cut="md"
          surface="raised"
          shadow="stone"
          className={styles.swatch}
        >
          <span className={styles.swatchLabel}>Средний срез</span>
        </CutBox>

        <CutBox
          cut="lg"
          bordered
          className={styles.swatch}
        >
          <span className={styles.swatchLabel}>Крупный срез с&nbsp;обводкой</span>
        </CutBox>
      </div>
    ),
  },
  {
    id: 'buttons',
    name: 'Кнопки',
    note: 'Киноварь — покупка билета, обводка — второстепенное действие.',
    view: (
      <div className={styles.row}>
        <Button href="https://radario.ru/">Купить билет</Button>
        <Button
          kind="ghost"
          href="/schedule"
        >
          Все даты и&nbsp;цены
        </Button>
        <Button
          size="sm"
          href="https://radario.ru/"
        >
          Билет
        </Button>
        <Button
          kind="ghost"
          size="sm"
          href="/schedule"
        >
          Подробнее
        </Button>
      </div>
    ),
  },
  {
    id: 'price',
    name: 'Цена',
    note: 'Знак рубля — отдельный элемент текстовой гарнитурой: в Ponomar его нет, и переноса перед ним быть не должно. Последний образец стоит в колонке уже цены и в окружении, где текст рвется где угодно: на артборде это правило висит на всех текстовых элементах, и именно там знак уезжал на свою строку.',
    view: (
      <div className={styles.row}>
        <Price
          value="850"
          note="взрослый билет"
        />

        <Price
          value="450"
          prefix="от"
          note="детский билет"
        />

        <Price value="2400" />

        <div className={styles.squeeze}>
          <Price
            value={'12 400'}
            note="узкая колонка"
          />
        </div>
      </div>
    ),
  },
  {
    id: 'photo',
    name: 'Кадр и вуаль',
    note: 'Подпись поверх кадра лежит на вуали: без нее текст тонет в фотографии.',
    view: (
      <div className={styles.row}>
        <PhotoSlot
          band
          caption="Подпись поверх кадра — она приезжает из CMS и может занять две строки."
          className={styles.photo}
        />
      </div>
    ),
  },
  {
    id: 'card',
    name: 'Карточка события',
    note: 'Афиша на главной и в расписании.',
    view: (
      <div className={styles.cards}>
        <EventCard event={SAMPLE_EVENT} />
        <EventCard event={SAMPLE_EVENT_FROM} />
      </div>
    ),
  },
  {
    id: 'panel',
    name: 'Панель ближайшего события',
    note: 'Путь до билета в три шага: дата, цена, касса.',
    view: (
      <div className={styles.panel}>
        <StonePanel event={SAMPLE_PANEL_EVENT} />
      </div>
    ),
  },
];

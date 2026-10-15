import { CutBox } from '@/components/CutBox';
import { MoreLink } from '@/components/MoreLink';
import { RunicText } from '@/components/RunicText';
import { Split } from '@/components/Split';
import { SCHEDULE_PATH } from '@/lib/consts';
import { paragraphs, phoneHref, typograph } from '@/lib/format';
import { BOOKING_INTRO, CAMPING_HEADINGS, CAMPING_KICKERS, CAMPING_PARTS, SCHEDULE_LINK_LABEL } from '../../consts';
import type { CampingParts } from '../../types';
import shared from '../CampingContent.module.scss';
import styles from './Booking.module.scss';

export type BookingProps = {
  /** Раздел «Телефон» из CMS; нет его — звонят по общему номеру владельцев. */
  booking: CampingParts['booking'];
  /** Общий телефон владельцев. */
  phone: string;
};

/**
 * Бронирование: в рейке заголовок и ссылка на даты мероприятий, в поле стальная панель с подписью, крупным номером
 * ссылкой `tel:` и тем, кому звонить. Раздел есть всегда: без раздела «Телефон» в CMS номер — общий номер владельцев,
 * чтобы забронировать место со страницы можно было и тогда.
 */
export const Booking = ({ booking, phone }: BookingProps) => {
  const anchor = booking?.anchor ?? CAMPING_PARTS.booking.anchor;
  const titleId = `${anchor}-title`;
  const number = booking?.phone ?? phone;
  const intro = booking ? paragraphs(booking.intro) : [typograph(BOOKING_INTRO)];

  return (
    <Split
      id={anchor}
      labelledBy={titleId}
      rail={
        <>
          <RunicText size="kicker">{CAMPING_KICKERS.booking}</RunicText>
          <h2
            className={shared.title}
            id={titleId}
          >
            {typograph(booking?.heading?.trim() || CAMPING_HEADINGS.booking)}
          </h2>
          <MoreLink href={SCHEDULE_PATH}>{SCHEDULE_LINK_LABEL}</MoreLink>
        </>
      }
    >
      <CutBox
        surface="steel"
        className={styles.panel}
      >
        {intro.map((paragraph) => (
          <p
            key={paragraph}
            className={styles.caps}
          >
            {paragraph}
          </p>
        ))}
        <a
          className={styles.phone}
          href={phoneHref(number)}
        >
          {number}
        </a>
        {booking?.person ? <p className={styles.person}>{typograph(booking.person)}</p> : null}
      </CutBox>
    </Split>
  );
};

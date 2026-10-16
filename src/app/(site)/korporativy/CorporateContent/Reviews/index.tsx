import { Split } from '@/components/Split';
import { paragraphs, typograph } from '@/lib/format';
import { CORPORATE_HEADINGS, CORPORATE_KICKERS } from '../../consts';
import type { CorporateReview } from '../../types';
import shared from '../CorporateContent.module.scss';
import { Rail } from '../Rail';
import styles from './Reviews.module.scss';

export type ReviewsProps = {
  reviews: CorporateReview[];
};

/**
 * Отзывы гостей — только настоящие, из коллекции `reviews`. Пока владельцы их не дали, коллекция пуста и раздела
 * на странице нет вовсе: пустой раздел или выдуманный отзыв хуже, чем никакого.
 */
export const Reviews = ({ reviews }: ReviewsProps) => {
  if (!reviews.length) {
    return null;
  }

  return (
    <Split
      id="reviews"
      labelledBy="reviews-title"
      rail={
        <Rail
          kicker={CORPORATE_KICKERS.reviews}
          heading={CORPORATE_HEADINGS.reviews}
          titleId="reviews-title"
        />
      }
    >
      <ul className={styles.reviews}>
        {reviews.map((review) => (
          <li
            key={review.id}
            className={shared.card}
          >
            <figure className={styles.review}>
              <blockquote>
                {paragraphs(review.text).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </blockquote>
              <figcaption>
                <b>{typograph(review.author)}</b>
                {review.occasion ? <span className={shared.caps}>{typograph(review.occasion)}</span> : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Split>
  );
};

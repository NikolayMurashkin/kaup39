import type { ZoneMark } from '@/cms/types';
import { MARK_ID_PREFIX } from '../SvgDefs/consts';
import styles from './Mark.module.scss';

export type MarkProps = {
  mark: ZoneMark;
  className?: string;
};

/** Знак площадки: символ из спрайта `SvgDefs`, контур цветом акцента. */
export const Mark = ({ mark, className }: MarkProps) => (
  <svg
    className={[styles.mark, className].filter(Boolean).join(' ')}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <use href={`#${MARK_ID_PREFIX}${mark}`} />
  </svg>
);

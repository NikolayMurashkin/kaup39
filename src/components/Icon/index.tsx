import { ICON_PATHS } from './consts';
import styles from './Icon.module.scss';
import type { IconName } from './types';

export type IconProps = {
  name: IconName;
  className?: string;
};

/** Значок линией в цвет текста. Всегда декоративный: подпись несет кнопка или ссылка вокруг него. */
export const Icon = ({ name, className }: IconProps) => (
  <svg
    className={[styles.icon, className].filter(Boolean).join(' ')}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d={ICON_PATHS[name]} />
  </svg>
);

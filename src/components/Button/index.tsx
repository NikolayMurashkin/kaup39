import type { ReactNode } from 'react';
import styles from './Button.module.scss';
import type { ButtonKind, ButtonSize } from './types';

export type ButtonProps = {
  children: ReactNode;
  kind?: ButtonKind;
  size?: ButtonSize;
  /** Кнопка на всю ширину колонки: так она стоит в панели ближайшего события. */
  block?: boolean;
  href?: string;
  className?: string;
};

export const Button = ({ children, kind = 'primary', size = 'md', block = false, href, className }: ButtonProps) => {
  const classes = [styles.button, styles[kind], styles[size], block ? styles.block : null, className]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <a
        className={classes}
        href={href}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      className={classes}
      type="button"
    >
      {children}
    </button>
  );
};

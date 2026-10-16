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
  /** Действие кнопки без адреса: например, показать карту. */
  onClick?: () => void;
  /** Кнопка отправки формы; по умолчанию кнопка ничего не отправляет. */
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
};

export const Button = ({
  children,
  kind = 'primary',
  size = 'md',
  block = false,
  href,
  onClick,
  type = 'button',
  disabled,
  className,
}: ButtonProps) => {
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
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

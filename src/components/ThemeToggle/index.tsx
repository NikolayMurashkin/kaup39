'use client';

import { useRouter } from 'next/navigation';
import { THEME_COOKIE } from '@/lib/consts';
import type { Theme } from '@/lib/types';
import { IconButton } from '../IconButton';
import { THEME_COOKIE_MAX_AGE, THEME_LABELS, THEME_TEXT } from './consts';
import styles from './ThemeToggle.module.scss';

export type ThemeToggleProps = {
  theme: Theme;
  /** `text` — кнопка со словами, как в меню телефона; по умолчанию — значок, как в шапке. */
  variant?: 'icon' | 'text';
  className?: string;
};

/**
 * Тема живет в куке и рисуется на сервере, поэтому переключатель меняет `data-theme` сразу, а страницу
 * перерисовывает сервер: у темы свой кадр первого экрана, вечерний или дневной.
 */
export const ThemeToggle = ({ theme, variant = 'icon', className }: ThemeToggleProps) => {
  const router = useRouter();
  const next = theme === 'dark' ? 'light' : 'dark';

  const toggle = () => {
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
    document.documentElement.dataset.theme = next;
    router.refresh();
  };

  if (variant === 'text') {
    return (
      <button
        className={[styles.text, className].filter(Boolean).join(' ')}
        type="button"
        onClick={toggle}
      >
        {THEME_TEXT}
      </button>
    );
  }

  return (
    <IconButton
      icon={next === 'light' ? 'sun' : 'moon'}
      label={THEME_LABELS[next]}
      className={className}
      onClick={toggle}
    />
  );
};

'use client';

import { useRouter } from 'next/navigation';
import { THEME_COOKIE } from '@/lib/consts';
import type { Theme } from '@/lib/types';
import { THEME_COOKIE_MAX_AGE, THEME_LABELS } from './consts';
import styles from './ThemeToggle.module.scss';

export type ThemeToggleProps = {
  theme: Theme;
};

/**
 * Тема живет в куке и рисуется на сервере, поэтому переключатель меняет `data-theme` сразу, а страницу
 * перерисовывает сервер: у темы свой кадр первого экрана, вечерний или дневной.
 */
export const ThemeToggle = ({ theme }: ThemeToggleProps) => {
  const router = useRouter();
  const next = theme === 'dark' ? 'light' : 'dark';

  const toggle = () => {
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
    document.documentElement.dataset.theme = next;
    router.refresh();
  };

  return (
    <button
      className={styles.toggle}
      type="button"
      aria-label={THEME_LABELS[next]}
      onClick={toggle}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {next === 'light' ? (
          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        )}
      </svg>
    </button>
  );
};

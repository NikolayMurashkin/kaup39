'use client';

import { useRouter } from 'next/navigation';
import { THEME_COOKIE } from '@/lib/consts';
import type { Theme } from '@/lib/types';
import { warmHeroPhoto } from '../FirstScreen/warmHeroPhoto';
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
 * Тема живет в куке и рисуется на сервере. Переключатель меняет `data-theme` сразу — CSS тут же показывает кадр
 * первого экрана новой темы, который уже в разметке, — а остальное перерисовывает сервер. Кадр новой темы начинает
 * грузиться еще при наведении или фокусе на переключателе.
 */
export const ThemeToggle = ({ theme, variant = 'icon', className }: ThemeToggleProps) => {
  const router = useRouter();
  const next = theme === 'dark' ? 'light' : 'dark';

  const toggle = () => {
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
    document.documentElement.dataset.theme = next;
    router.refresh();
  };

  const warm = () => warmHeroPhoto(next);

  if (variant === 'text') {
    return (
      <button
        className={[styles.text, className].filter(Boolean).join(' ')}
        type="button"
        onClick={toggle}
        onPointerEnter={warm}
        onFocus={warm}
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
      onIntent={warm}
    />
  );
};

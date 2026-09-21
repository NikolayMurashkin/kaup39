import type { TokenSurface } from './types';

const CANVAS_TEXTS = [
  { token: '--text-primary', label: 'Основной текст' },
  { token: '--text-muted', label: 'Приглушенный текст' },
  { token: '--text-accent', label: 'Акцентный текст' },
];

/** Поверхности из таблицы токенов артборда — по одной на каждую пару «текст на фоне». */
export const TOKEN_SURFACES: TokenSurface[] = [
  { background: '--bg-canvas', name: 'Полотно', nameToken: '--text-primary', texts: CANVAS_TEXTS },
  { background: '--bg-surface', name: 'Поверхность', nameToken: '--text-primary', texts: CANVAS_TEXTS },
  { background: '--bg-raised', name: 'Приподнятая плашка', nameToken: '--text-primary', texts: CANVAS_TEXTS },
  {
    background: '--bg-accent',
    name: 'Киноварь',
    nameToken: '--text-on-accent',
    texts: [{ token: '--text-on-accent', label: 'Текст на\u00a0киновари' }],
  },
  {
    background: '--bg-steel',
    name: 'Железо',
    nameToken: '--text-on-steel',
    texts: [{ token: '--text-on-steel', label: 'Текст на\u00a0железе' }],
  },
];

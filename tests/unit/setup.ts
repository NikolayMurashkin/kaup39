import { imageConfigDefault } from 'next/dist/shared/lib/image-config';
import { IMAGES_CONFIG } from '@/lib/images';

/**
 * `next/image` читает настройки оптимизатора из `process.env.__NEXT_IMAGE_OPTS`, который сборка подменяет объектом.
 * Без них в тестах любое качество сводится к 75 по умолчанию. Строкой переменную Next не поймет, поэтому окружение
 * процесса заменяется копией, где она объект, как после подстановки.
 */
process.env = {
  ...process.env,
  __NEXT_IMAGE_OPTS: { ...imageConfigDefault, ...IMAGES_CONFIG },
} as unknown as NodeJS.ProcessEnv;

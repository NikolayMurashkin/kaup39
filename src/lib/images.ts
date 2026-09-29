import type { NextConfig } from 'next';

/**
 * Качество кадра первого экрана. Кадр лежит под скримом плотностью от 0,7 до 0,97, и артефакты сжатия
 * под ним не видны, а на мобильной ширине он и есть LCP: при качестве 75 кадр весил 330 КБ.
 */
export const HERO_QUALITY = 40;

/**
 * Качество кадра первого экрана шире 640 px: там кадр растянут на всю ширину окна, и при качестве 40 огонь и искры
 * расплываются в пятна. Мобильный Lighthouse этот источник не грузит.
 */
export const HERO_WIDE_QUALITY = 75;

/**
 * Настройки оптимизатора картинок — общие для `next.config.ts` и unit-тестов: без них `next/image` в тестах
 * сводит любое качество к 75 по умолчанию. Оптимизатор отдает только файлы медиатеки Payload: адрес с чужим путем
 * или параметрами получит 400.
 */
export const IMAGES_CONFIG = {
  localPatterns: [{ pathname: '/api/media/file/**', search: '' }],
  formats: ['image/avif', 'image/webp'],
  qualities: [HERO_QUALITY, HERO_WIDE_QUALITY],
} satisfies NonNullable<NextConfig['images']>;

/**
 * Кандидаты `srcSet` с дескрипторами, которым можно верить: оптимизатор не увеличивает файл и на `w=1920` отдает
 * кадр 1600 px, а браузер по дескриптору `1920w` счел бы его плотнее и нарисовал мельче. Кандидаты уже файла
 * остаются как есть, первый не уже файла получает дескриптор ширины файла, остальные отбрасываются.
 */
export const fitSrcSet = (srcSet: string, fileWidth: number) => {
  const fitted: string[] = [];

  for (const candidate of srcSet.split(', ')) {
    const [url, descriptor] = candidate.split(' ');
    const width = Number.parseInt(descriptor, 10);

    fitted.push(`${url} ${Math.min(width, fileWidth)}w`);

    if (width >= fileWidth) {
      break;
    }
  }

  return fitted.join(', ');
};

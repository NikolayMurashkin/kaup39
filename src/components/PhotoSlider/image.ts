import { getImageProps } from 'next/image';
import type { Photo } from '@/cms/types';
import { fitSrcSet } from '@/lib/images';
import { VIEWER_FALLBACK_SIZE, VIEWER_WIDTH } from './consts';

/**
 * Кадр просмотра не шире файла и окна: `sizes` ограничен шириной файла и окна, а дескрипторы `srcSet` — тем, что
 * отдаст оптимизатор, иначе на плотном экране браузер нарисовал бы файл 1600 px шириной около 500.
 */
export const viewerImageProps = ({ src, alt, width, height }: Photo, windowWidth = VIEWER_WIDTH) => {
  const fileWidth = width ?? VIEWER_FALLBACK_SIZE.width;
  const cap = Math.min(fileWidth, windowWidth);
  const { props } = getImageProps({
    src,
    alt,
    width: fileWidth,
    height: height ?? VIEWER_FALLBACK_SIZE.height,
    sizes: `(max-width: ${cap}px) 100vw, ${cap}px`,
  });

  return width && props.srcSet ? { ...props, srcSet: fitSrcSet(props.srcSet, width) } : props;
};

/** Кадр просмотра грузится заранее: браузер кладет его в кеш, и `<img>` просмотра берет его оттуда. */
export const preloadViewerImage = (photo: Photo | undefined, windowWidth = VIEWER_WIDTH) => {
  if (!photo) {
    return;
  }

  const { src, srcSet, sizes } = viewerImageProps(photo, windowWidth);
  const image = new window.Image();

  image.sizes = sizes ?? '';
  image.srcset = srcSet ?? '';
  image.src = src;
};

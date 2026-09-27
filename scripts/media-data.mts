import type { ContentMedia, PhotoRegistry } from './content-types';

/**
 * Данные записи медиатеки для фотографии из файла контента. Отметка временного кадра (D31) берется из основания
 * строки реестра: сайт подписывает такой кадр «фото для примера». Повторный импорт выставляет отметку заново, так что
 * кадр, замененный в реестре кадром владельцев, подпись теряет.
 */
export const mediaData = ({ file, alt, caption }: ContentMedia, registry: PhotoRegistry) => ({
  alt,
  caption,
  temporary: registry.photos.some((record) => record.file === file && record.basis === 'temporary'),
});

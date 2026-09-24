import path from 'node:path';
import { DEFAULT_MEDIA_DIR } from '../../../src/cms/consts';

/** Путь от корня файловой системы без учета регистра: на маке `Media` открывает тот же каталог, что `media`. */
const normalized = (dir: string) => path.resolve(dir).toLowerCase();

/**
 * Каталог совпадает с медиатекой владельцев или лежит выше нее: засев стер бы фотографии вместе с ним.
 * Пути сравниваются разрешенными от рабочего каталога — так же, как их понимают Payload и `rmSync`, — и без
 * учета регистра: на файловой системе, которая регистр различает, лишний отказ безопаснее стертой медиатеки.
 */
export const coversOwnersMedia = (dir: string) => {
  const inside = path.relative(normalized(dir), normalized(DEFAULT_MEDIA_DIR));

  return !inside.startsWith('..') && !path.isAbsolute(inside);
};

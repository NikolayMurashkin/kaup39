import type { NextConfig } from 'next';
import { imageConfigDefault } from 'next/dist/shared/lib/image-config.js';
import type { CollectionAfterChangeHook, Payload } from 'payload';
import { IMAGES_CONFIG } from '../lib/images';
import type { Media } from '../payload-types';
import { WARMUP_ACCEPT, WARMUP_SKIPPED_TYPES, WARMUP_TIMEOUT_MS } from './consts';

const images = IMAGES_CONFIG as NonNullable<NextConfig['images']>;

/** Ширины оптимизатора так, как их видит Next: умолчания с поправками конфига, по возрастанию, без повторов. */
const WIDTHS = [
  ...new Set([
    ...(images.imageSizes ?? imageConfigDefault.imageSizes),
    ...(images.deviceSizes ?? imageConfigDefault.deviceSizes),
  ]),
].sort((first, second) => first - second);

/**
 * Адреса оптимизатора, которые браузер может попросить у кадра: каждая ширина оптимизатора на каждое качество конфига.
 * Ширина файла отбор не сужает: `srcSet` у `<Image>` без `fitSrcSet` перечисляет и ширины шире файла — оптимизатор
 * отдаст файл без увеличения, но ключ кэша у каждой ширины свой, и непрогретую первый посетитель ждал бы.
 */
export const warmupPaths = ({ url }: { url: string; width: number }): string[] =>
  WIDTHS.flatMap((w) =>
    IMAGES_CONFIG.qualities.map((q) => `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=${q}`),
  );

/**
 * Свой же сервер: образ слушает все адреса на `PORT`; `next start -p` и `server.js` сборки после запуска пишут
 * выбранный порт в `process.env.PORT`.
 */
const origin = () => `http://127.0.0.1:${process.env.PORT ?? 3000}`;

const reasonOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Просит у оптимизатора варианты кадра по одному: параллельные кодировки AVIF заняли бы процессор сервера целиком.
 * Первый отказ останавливает цепочку — у того же файла остальные ширины упадут так же — и пишется в журнал.
 */
const warm = async (payload: Payload, filename: string, paths: string[]) => {
  for (const path of paths) {
    try {
      const response = await fetch(`${origin()}${path}`, {
        headers: { Accept: WARMUP_ACCEPT },
        signal: AbortSignal.timeout(WARMUP_TIMEOUT_MS),
      });

      await response.body?.cancel();

      if (!response.ok) {
        payload.logger.warn(`Прогрев кадра ${filename} остановлен: оптимизатор ответил ${response.status} на ${path}`);

        return;
      }
    } catch (error) {
      payload.logger.warn(`Прогрев кадра ${filename} остановлен на ${path}: ${reasonOf(error)}`);

      return;
    }
  }
};

const isWarmable = (doc: Media) =>
  Boolean(doc.url && doc.width && doc.filename && doc.mimeType?.startsWith('image/')) &&
  !WARMUP_SKIPPED_TYPES.includes(doc.mimeType ?? '');

/**
 * После сохранения нового кадра или замены файла прогревает оптимизатор, чтобы первую кодировку AVIF ждал не первый
 * посетитель. Сохранение прогрева не ждет; правка подписи и прочих полей файл не меняет и не прогревает.
 */
export const warmupMedia: CollectionAfterChangeHook<Media> = ({ doc, previousDoc, operation, req }) => {
  const fileChanged = operation === 'create' || doc.filename !== previousDoc?.filename;

  if (fileChanged && isWarmable(doc)) {
    void warm(req.payload, doc.filename!, warmupPaths({ url: doc.url!, width: doc.width! }));
  }

  return doc;
};

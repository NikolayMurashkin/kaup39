import config from '@payload-config';
import { getPayload } from 'payload';
import { cache } from 'react';

/** Настройки сайта для рамки страницы: название, телефон, почта, адрес. */
export const getSite = cache(async () => {
  const payload = await getPayload({ config });

  return payload.findGlobal({ slug: 'site', depth: 0 });
});

import { RATE_LIMIT_MAX_KEYS } from './consts';
import type { RateLimiterOptions } from './types';

/** Скользящее окно по адресу. Память живет в процессе: демо крутится одним контейнером. */
export const createRateLimiter = ({ limit, windowMs }: RateLimiterOptions) => {
  const hits = new Map<string, number[]>();

  const prune = (now: number) => {
    for (const [key, times] of hits) {
      if (times.every((time) => now - time >= windowMs)) {
        hits.delete(key);
      }
    }
  };

  return {
    allow(key: string, now: number = Date.now()) {
      if (hits.size > RATE_LIMIT_MAX_KEYS) {
        prune(now);
      }

      const fresh = (hits.get(key) ?? []).filter((time) => now - time < windowMs);

      if (fresh.length >= limit) {
        hits.set(key, fresh);

        return false;
      }

      hits.set(key, [...fresh, now]);

      return true;
    },
  };
};

import type { Tavern, Zone } from '@/payload-types';

/** Место, чье окно открывает точка карты. */
export type PointPlace = { kind: 'zone'; zone: Zone } | { kind: 'tavern'; tavern: Tavern };

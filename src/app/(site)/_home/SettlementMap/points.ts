import type { MapPoint, Tavern, Zone } from '@/payload-types';
import type { PointPlace } from './types';

/** Точки по номеру, равные номера — по id: в этом порядке их обходит Tab и читает список. */
export const sortPoints = (points: MapPoint[]) =>
  [...points].sort((left, right) => left.number - right.number || left.id - right.id);

/** Номер на метке карты — двумя цифрами, как у карточек площадок: «02». */
export const dotNumber = (number: number) => String(number).padStart(2, '0');

const idOf = (value: number | { id: number }) => (typeof value === 'object' ? value.id : value);

/**
 * Площадка или таверна, чье окно открывает точка. Берется из списков главной по id связи: связь на удаленную
 * площадку или таверну дает `null` — точка открывает свое окно.
 */
export const pointPlace = (point: MapPoint, zones: Zone[], taverns: Tavern[]): PointPlace | null => {
  const link = point.link;

  if (!link) return null;

  const id = idOf(link.value);

  if (link.relationTo === 'zones') {
    const zone = zones.find((candidate) => candidate.id === id);

    return zone ? { kind: 'zone', zone } : null;
  }

  const tavern = taverns.find((candidate) => candidate.id === id);

  return tavern ? { kind: 'tavern', tavern } : null;
};

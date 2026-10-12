import type { Page } from '@/payload-types';
import { DIRECTIONS_PARTS } from './consts';
import type { DirectionsParts } from './types';

const PART_KEYS = Object.keys(DIRECTIONS_PARTS) as (keyof typeof DIRECTIONS_PARTS)[];

/**
 * Разделы страницы «как доехать» по частям: часть занимает первый раздел с ее якорем и типом блока. Раздел с чужим
 * якорем, с известным якорем, но чужим типом, и повтор якоря не пропадают: они идут в `rest` в порядке CMS.
 */
export const directionsParts = (sections: Page['sections']): DirectionsParts => {
  const parts: DirectionsParts = {
    ...(Object.fromEntries(PART_KEYS.map((key) => [key, null])) as Record<(typeof PART_KEYS)[number], null>),
    rest: [],
  };

  for (const section of sections ?? []) {
    const key = PART_KEYS.find(
      (candidate) =>
        parts[candidate] === null &&
        DIRECTIONS_PARTS[candidate].anchor === section.anchor &&
        DIRECTIONS_PARTS[candidate].blockType === section.blockType,
    );

    if (key) Object.assign(parts, { [key]: section });
    else parts.rest.push(section);
  }

  return parts;
};

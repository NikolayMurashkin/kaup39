import { LETTERS, LETTER_SPACING, SPACE_WIDTH } from './alphabet';
import type { RunicPath } from './types';

/**
 * Собирает путь надписи: только отрезки, по одному `M…L…` на полилинию.
 * Неизвестные знаки пропускаются — в надписях направления их быть не должно.
 */
export const runicPath = (text: string): RunicPath => {
  const parts: string[] = [];
  let offset = 0;

  for (const char of text.toUpperCase()) {
    if (char === ' ') {
      offset += SPACE_WIDTH + LETTER_SPACING;
      continue;
    }

    const letter = LETTERS[char];

    if (!letter) {
      continue;
    }

    for (const line of letter.lines) {
      parts.push(
        line.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${(offset + x).toFixed(2)} ${y.toFixed(2)}`).join(''),
      );
    }

    offset += letter.width + LETTER_SPACING;
  }

  return { d: parts.join(''), width: Math.max(0, offset - LETTER_SPACING) };
};

import { describe, expect, it } from 'vitest';
import { GLYPHS } from '../../scripts/subset-glyphs.mts';
import { repositoryCharacters } from '../lib/texts';

const NBSP = String.fromCodePoint(0x00a0);

describe('набор символов сабсета', () => {
  it('покрывает все знаки текстов репозитория: знак вне сабсета отрисуется запасной гарнитурой', () => {
    const subset = new Set(GLYPHS);

    expect([...repositoryCharacters()].filter((character) => !subset.has(character))).toEqual([]);
  });

  it('сборщик текстов видит JSX-сущности, escape-последовательности и JSX-текст', () => {
    expect([...repositoryCharacters()]).toEqual(expect.arrayContaining([NBSP, '₽', 'Ж', '—']));
  });
});

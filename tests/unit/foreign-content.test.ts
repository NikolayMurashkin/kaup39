import { describe, expect, it } from 'vitest';
import { MEDIA_DIR } from '@/cms/consts';
import { isIgnoredByGit, readTextFile, repositoryFiles } from '../lib/repository';

/** Своим иконкам место здесь; любая другая растровая картинка в дереве — чужая фотография. */
const OWN_ICONS_DIR = 'public/icons/';

const PHOTO_EXTENSION = /\.(jpe?g|png)$/i;

/**
 * Десять фраз исходного сайта. Лежат в base64 намеренно: список открытым текстом сам был бы чужим
 * контентом в git, а так тест проверяет и собственный файл.
 */
const FOREIGN_PHRASES = [
  '0J/QvtGB0LXQu9C10L3QuNC1INCy0LjQutC40L3Qs9C+0LI=',
  '0JrQvtGA0YfQvNCwINGDINCx0L7QsdGA0LA=',
  '0J/RgNGP0L3QsNGPINC80LDQutGA0LXQu9GM',
  '0J/QvtCy0LDRgNC90Y8=',
  '0LTRgNCw0LrQutCw0YA=',
  '0JTQvtC8INCv0YDQu9Cw',
  '0JLQuNC90LTRg9GA',
  '0KDQvtC80LDQvdC+0LLQvg==',
  '0YLRgNCw0L3RgdGE0LXRgA==',
  '0LrQtdC80L/QuNC90LM=',
].map((encoded) => Buffer.from(encoded, 'base64').toString('utf8'));

/**
 * Регистр не важен, пробел между словами бывает любым: обычный, неразрывный, сущность в JSX
 * (`&nbsp;`, `&#160;`, `&#xa0;` и с ведущими нулями), escape-последовательность в строке или
 * JSX-разрыв `{' '}` с обычным или неразрывным пробелом внутри —
 * типограф ставит их как раз между словами таких фраз.
 */
const normalize = (text: string) =>
  text
    .replace(/&nbsp;|&#0*160;|&#x0*a0;|\\u00a0|\\xa0|\\u\{0*a0\}/gi, ' ')
    .replace(/\{\s*(['"`])(?: |\xa0|\\u00a0|\\xa0|\\u\{0*a0\})\1\s*\}/gi, ' ')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('ru');

const phrasesIn = (text: string) => {
  const normalized = normalize(text);

  return FOREIGN_PHRASES.filter((phrase) => normalized.includes(normalize(phrase)));
};

describe('в дереве репозитория нет чужого контента', () => {
  it('ни одного .jpg, .jpeg, .png вне папки собственных иконок', () => {
    const photos = repositoryFiles().filter((path) => PHOTO_EXTENSION.test(path) && !path.startsWith(OWN_ICONS_DIR));

    expect(photos).toEqual([]);
  });

  it('ни одна из десяти фраз исходного сайта не встречается в текстах репозитория', () => {
    const found = repositoryFiles().flatMap((path) => {
      const text = readTextFile(path);

      return text === null ? [] : phrasesIn(text).map((phrase) => `${path}: ${phrase}`);
    });

    expect(found).toEqual([]);
  });

  it('медиатека CMS закрыта .gitignore: загруженные фотографии не попадут в коммит', () => {
    expect(isIgnoredByGit(`${MEDIA_DIR}/photo.jpg`)).toBe(true);
  });

  it('проверка не пустая: фраз десять, текстов в обходе много, и фраза находится при любом пробеле и регистре', () => {
    expect(new Set(FOREIGN_PHRASES).size).toBe(10);
    expect(repositoryFiles().filter((path) => readTextFile(path) !== null).length).toBeGreaterThan(80);

    FOREIGN_PHRASES.forEach((phrase) => {
      const variants = [
        phrase,
        phrase.toLocaleUpperCase('ru'),
        phrase.replace(/ /g, '&nbsp;'),
        phrase.replace(/ /g, '&#160;'),
        phrase.replace(/ /g, '&#xA0;'),
        phrase.replace(/ /g, '&#0160;'),
        phrase.replace(/ /g, `{'${String.fromCodePoint(0x00a0)}'}`),
        phrase.replace(/ /g, '\\u{a0}'),
        phrase.replace(/ /g, "{' '}\n        "),
        phrase.replace(/ /g, '{"\\u00a0"}'),
        phrase.replace(/ /g, '\\u00a0'),
        phrase.replace(/ /g, String.fromCodePoint(0x00a0)),
      ];

      variants.forEach((variant) => expect(phrasesIn(`…${variant}…`)).toEqual([phrase]));
    });
  });
});

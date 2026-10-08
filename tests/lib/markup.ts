const NBSP = / /g;

/** Текст разметки без тегов; неразрывный пробел — обычным. */
export const textOf = (markup: string) =>
  markup
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(NBSP, ' ');

export type Img = { src: string; srcSet: string; sizes: string; loading: string; alt: string };

const attribute = (tag: string, name: string) =>
  (tag.match(new RegExp(` ${name}="([^"]*)"`))?.[1] ?? '').replace(/&amp;/g, '&');

/** Все `<img>` разметки по порядку. */
export const imagesOf = (markup: string): Img[] =>
  (markup.match(/<img [^>]*>/g) ?? []).map((tag) => ({
    src: attribute(tag, 'src'),
    srcSet: attribute(tag, 'srcSet'),
    sizes: attribute(tag, 'sizes'),
    loading: attribute(tag, 'loading'),
    alt: attribute(tag, 'alt'),
  }));

/** Файл кадра в адресе оптимизатора (`/_next/image?url=%2Fapi%2F…`). */
export const showsFile = (image: Img | undefined, file: string) =>
  Boolean(image) && decodeURIComponent(image!.src).includes(file);

/** Кандидаты `srcset`: запрошенная ширина из адреса и дескриптор. */
export const candidatesOf = (image: Img) =>
  image.srcSet
    .split(', ')
    .filter(Boolean)
    .map((candidate) => ({
      requested: Number(candidate.match(/[?&;]w=(\d+)/)?.[1]),
      descriptor: Number(candidate.match(/ (\d+)w$/)?.[1]),
    }));

export type Dialog = { label: string; html: string };

/** Диалоги разметки по порядку: имя и содержимое. */
export const dialogsOf = (markup: string): Dialog[] =>
  [...markup.matchAll(/<dialog\b([^>]*)>(.*?)<\/dialog>/gs)].map(([, attributes, html]) => ({
    label: attribute(` ${attributes}`, 'aria-label'),
    html,
  }));

export type Tile = { button: string; dialog: Dialog };

/** Кнопки, открывающие диалог, вместе с диалогом, который стоит сразу за кнопкой. */
export const tilesOf = (markup: string): Tile[] =>
  [
    ...markup.matchAll(
      /<button\b[^>]*aria-haspopup="dialog"[^>]*>((?:(?!<\/button>).)*)<\/button>\s*(?:<\/\w+>\s*)*<dialog\b([^>]*)>(.*?)<\/dialog>/gs,
    ),
  ].map(([, button, attributes, html]) => ({
    button,
    dialog: { label: attribute(` ${attributes}`, 'aria-label'), html },
  }));

/** Число кнопок, открывающих диалог. */
export const triggersIn = (markup: string) => (markup.match(/<button\b[^>]*aria-haspopup="dialog"/g) ?? []).length;

export const SLIDER = 'aria-roledescription="слайдер"';

/** Часть диалога от корня слайдера до конца: кадр, подпись, счетчик и кнопки слайдера. */
export const sliderPart = (dialogHtml: string) => {
  const at = dialogHtml.indexOf(SLIDER);

  return at < 0 ? '' : dialogHtml.slice(at);
};

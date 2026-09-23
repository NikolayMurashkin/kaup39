import type { Field } from 'payload';
import { validateOptionalSlug, validateSlug } from './validate';

export const slugField: Field = {
  name: 'slug',
  type: 'text',
  label: 'Адрес страницы',
  required: true,
  unique: true,
  index: true,
  validate: validateSlug,
  admin: { description: 'Латиницей, например denvikingi' },
};

export const anchorField: Field = {
  name: 'anchor',
  type: 'text',
  label: 'Якорь',
  validate: validateOptionalSlug,
  admin: { description: 'Латиницей, для ссылки на раздел с других страниц: /kak-doehat#transfer' },
};

export const orderField: Field = {
  name: 'order',
  type: 'number',
  label: 'Порядок',
  required: true,
  defaultValue: 0,
  admin: { position: 'sidebar', description: 'Меньше — выше' },
};

/** Текст из нескольких абзацев: разметки нет, абзацы разделяются пустой строкой. */
export const paragraphsField = (name: string, label: string): Field => ({
  name,
  type: 'textarea',
  label,
  admin: { description: 'Абзацы разделяются пустой строкой' },
});

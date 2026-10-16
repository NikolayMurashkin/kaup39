/** Раздел политики: заголовок, абзацы и, если нужно, список после них. */
export type PolicySection = {
  id: string;
  title: string;
  paragraphs: string[];
  items?: string[];
};

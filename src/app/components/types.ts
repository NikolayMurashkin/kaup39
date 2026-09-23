import type { ReactNode } from 'react';

export type ShowcaseSection = {
  id: string;
  name: string;
  /** Чем этот компонент занят на страницах демо. */
  note: string;
  view: ReactNode;
};

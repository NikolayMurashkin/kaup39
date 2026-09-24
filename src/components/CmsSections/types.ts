import type { PageSection } from '@/cms/types';

export type SectionGroup = {
  /** Блок, который открывает группу: его заголовок становится заголовком раздела. */
  lead: PageSection;
  attached: PageSection[];
};

export type BlockOf<T extends PageSection['blockType']> = Extract<PageSection, { blockType: T }>;

export type ParagraphsProps = {
  text: string | null | undefined;
  className?: string;
};

export type PricesTableProps = { block: BlockOf<'prices'> };

export type ItemListProps = { block: BlockOf<'list'> };

export type LinkRowProps = { block: BlockOf<'links'> };

export type AttachedProps = { block: PageSection };

export type GalleryProps = { block: BlockOf<'photos'> };

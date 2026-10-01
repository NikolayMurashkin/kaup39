import type { PageSection } from '@/cms/types';
import { CmsSections } from '@/components/CmsSections';
import { groupSections } from '@/components/CmsSections/group';
import { Section } from '@/components/Section';
import { EXTRA_SECTIONS_SKIP } from '../consts';

export type ExtraSectionsProps = {
  sections: PageSection[];
};

/**
 * Разделы главной, которые владельцы добавили в CMS со своими якорями: рамка главной во всю ширину, поэтому они
 * встают в контейнер раздела, как остальные; таких разделов нет — нет и пустого отступа.
 */
export const ExtraSections = ({ sections }: ExtraSectionsProps) =>
  groupSections(sections, EXTRA_SECTIONS_SKIP).length ? (
    <Section>
      <CmsSections
        sections={sections}
        skip={EXTRA_SECTIONS_SKIP}
      />
    </Section>
  ) : null;

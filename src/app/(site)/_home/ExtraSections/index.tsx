import { HOME_ANCHORS } from '@/cms/consts';
import type { PageSection } from '@/cms/types';
import { CmsSections } from '@/components/CmsSections';
import { groupSections } from '@/components/CmsSections/group';
import { Section } from '@/components/Section';

export type ExtraSectionsProps = {
  sections: PageSection[];
};

const SKIP = Object.values(HOME_ANCHORS);

/**
 * Разделы главной, которые владельцы добавили в CMS со своими якорями: рамка главной во всю ширину, поэтому они
 * встают в контейнер раздела, как остальные; таких разделов нет — нет и пустого отступа.
 */
export const ExtraSections = ({ sections }: ExtraSectionsProps) =>
  groupSections(sections, SKIP).length ? (
    <Section>
      <CmsSections
        sections={sections}
        skip={SKIP}
      />
    </Section>
  ) : null;

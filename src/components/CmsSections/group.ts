import type { PageSection } from '@/cms/types';
import type { SectionGroup } from './types';

/**
 * Разделы страницы складываются в смысловые группы: текст или галерея открывают новую, а цены, списки
 * и ссылки пристегиваются к открытой — так «Кемпинг», его цены и услуги встают под одним заголовком.
 * Блоки с якорями из `skip` выпадают вместе с тем, что к ним пристегнуто.
 */
export const groupSections = (sections: PageSection[], skip: readonly string[] = []): SectionGroup[] => {
  const groups: SectionGroup[] = [];

  for (const section of sections) {
    const opens = section.blockType === 'text' || section.blockType === 'photos';

    if (opens || groups.length === 0) {
      groups.push({ lead: section, attached: [] });
    } else {
      groups[groups.length - 1].attached.push(section);
    }
  }

  return groups.filter((group) => !skip.includes(group.lead.anchor ?? ''));
};

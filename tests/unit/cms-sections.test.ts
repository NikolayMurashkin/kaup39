import { describe, expect, it } from 'vitest';
import type { PageSection } from '@/cms/types';
import { groupSections } from '@/components/CmsSections/group';

const text = (anchor: string) => ({ blockType: 'text', anchor }) as PageSection;
const prices = (anchor: string) => ({ blockType: 'prices', anchor, rows: [] }) as PageSection;
const list = (anchor: string) => ({ blockType: 'list', anchor, items: [] }) as PageSection;
const photos = (anchor: string) => ({ blockType: 'photos', anchor, photos: [] }) as PageSection;

const anchors = (sections: PageSection[], skip?: string[]) =>
  groupSections(sections, skip).map((group) => [group.lead.anchor, ...group.attached.map((block) => block.anchor)]);

describe('группы разделов страницы', () => {
  it('текст и галерея открывают группу, цены и списки пристегиваются к открытой', () => {
    expect(
      anchors([
        text('about'),
        photos('gallery'),
        text('camping'),
        prices('camping-prices'),
        list('camping-services'),
        text('rent'),
        prices('rent-prices'),
      ]),
    ).toEqual([['about'], ['gallery'], ['camping', 'camping-prices', 'camping-services'], ['rent', 'rent-prices']]);
  });

  it('цены в самом начале страницы открывают свою группу, а не пропадают', () => {
    expect(anchors([prices('first'), text('about')])).toEqual([['first'], ['about']]);
  });

  it('пропущенная группа выпадает вместе с пристегнутыми блоками', () => {
    expect(anchors([text('events'), list('events-list'), text('zones')], ['events'])).toEqual([['zones']]);
  });
});

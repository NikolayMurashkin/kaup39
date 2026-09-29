import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ExtraSections } from '@/app/(site)/_home/ExtraSections';
import { HOME_ANCHORS } from '@/cms/consts';
import type { PageSection } from '@/cms/types';
import { CmsSections } from '@/components/CmsSections';

const text = (anchor: string, heading: string): PageSection =>
  ({ blockType: 'text', anchor, heading, body: 'Текст раздела.' }) as PageSection;

describe('разделы CMS с другими якорями на главной (рамка во всю ширину)', () => {
  it('стоят внутри контейнера раздела, а не прилипают к краю окна', () => {
    const sections = [text(HOME_ANCHORS.about, 'О поселении'), text('camping', 'Кемпинг Каупа')];
    const bare = renderToStaticMarkup(
      <CmsSections
        sections={sections}
        skip={Object.values(HOME_ANCHORS)}
      />,
    );
    const markup = renderToStaticMarkup(<ExtraSections sections={sections} />);

    expect(bare).toContain('Кемпинг Каупа');
    expect(markup).toMatch(new RegExp(`^<section [^>]*>${bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</section>$`));
    expect(markup).not.toContain('О поселении');
  });

  it('других разделов нет — нет и пустого контейнера с отступом', () => {
    expect(renderToStaticMarkup(<ExtraSections sections={[text(HOME_ANCHORS.about, 'О поселении')]} />)).toBe('');
  });
});

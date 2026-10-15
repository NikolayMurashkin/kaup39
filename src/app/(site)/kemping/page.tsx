import type { Metadata } from 'next';
import { getCampingPage } from '@/cms/camping';
import { SiteFrame } from '@/components/SiteFrame';
import { paragraphs } from '@/lib/format';
import { getTheme } from '@/lib/theme';
import { CampingContent } from './CampingContent';
import { CAMPING_TITLE } from './consts';
import { campingParts } from './parts';

export const generateMetadata = async (): Promise<Metadata> => {
  const { site, page } = await getCampingPage();
  const [description] = paragraphs(campingParts(page?.sections).description?.body);

  return {
    title: `${page?.title ?? CAMPING_TITLE} — ${site.name}`,
    description: page?.lead?.trim() || description || site.address,
  };
};

const CampingPage = async () => {
  const [{ site, page }, theme] = await Promise.all([getCampingPage(), getTheme()]);

  return (
    <SiteFrame
      site={site}
      theme={theme}
      fullBleed
    >
      <CampingContent
        page={page}
        site={site}
        theme={theme}
      />
    </SiteFrame>
  );
};

export default CampingPage;

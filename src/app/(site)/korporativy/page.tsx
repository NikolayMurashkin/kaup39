import type { Metadata } from 'next';
import { getCorporatePage } from '@/cms/corporate';
import { SiteFrame } from '@/components/SiteFrame';
import { paragraphs } from '@/lib/format';
import { getTheme } from '@/lib/theme';
import { CorporateContent } from './CorporateContent';
import { CORPORATE_TITLE } from './consts';

export const generateMetadata = async (): Promise<Metadata> => {
  const { site, page } = await getCorporatePage();
  const [description] = paragraphs(page?.lead);

  return {
    title: `${page?.title ?? CORPORATE_TITLE} — ${site.name}`,
    description: description || site.address,
  };
};

const CorporatePage = async () => {
  const [{ site, page, reviews }, theme] = await Promise.all([getCorporatePage(), getTheme()]);

  return (
    <SiteFrame
      site={site}
      theme={theme}
      fullBleed
    >
      <CorporateContent
        page={page}
        site={site}
        reviews={reviews}
        theme={theme}
      />
    </SiteFrame>
  );
};

export default CorporatePage;

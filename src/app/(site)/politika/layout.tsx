import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getSite } from '@/cms/site';
import { SiteFrame } from '@/components/SiteFrame';
import { getTheme } from '@/lib/theme';
import { POLICY_LEAD, POLICY_TITLE } from './consts';

export const generateMetadata = async (): Promise<Metadata> => {
  const site = await getSite();

  return { title: `${POLICY_TITLE} — ${site.name}`, description: POLICY_LEAD };
};

type PolicyLayoutProps = {
  children: ReactNode;
};

/**
 * Рамка страницы политики: шапка и подвал с контактами из CMS. Сам текст — документ студии, а не контент владельцев,
 * он лежит в коде и рисуется без базы.
 */
const PolicyLayout = async ({ children }: PolicyLayoutProps) => {
  const [site, theme] = await Promise.all([getSite(), getTheme()]);

  return (
    <SiteFrame
      site={site}
      theme={theme}
      fullBleed
    >
      {children}
    </SiteFrame>
  );
};

export default PolicyLayout;

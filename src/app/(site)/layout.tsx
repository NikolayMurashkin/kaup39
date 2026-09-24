import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTheme } from '@/lib/theme';
import '@/styles/fonts';
import '@/styles/globals.scss';

export const metadata: Metadata = {
  title: 'Кауп',
};

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = async ({ children }: RootLayoutProps) => {
  const theme = await getTheme();

  return (
    <html
      lang="ru"
      data-theme={theme}
    >
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEventPage } from '@/cms/event';
import { SiteFrame } from '@/components/SiteFrame';
import { getTheme } from '@/lib/theme';
import { EventContent } from './EventContent';

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

export const generateMetadata = async ({ params }: EventPageProps): Promise<Metadata> => {
  const data = await getEventPage((await params).slug);

  if (!data) {
    return {};
  }

  const { event, site } = data;

  return { title: `${event.title} — ${site.name}`, description: event.summary?.trim() || site.address };
};

/** Страница события из CMS: адрес — slug события, события нет — 404. */
const EventPage = async ({ params }: EventPageProps) => {
  const [data, theme] = await Promise.all([getEventPage((await params).slug), getTheme()]);

  if (!data) {
    notFound();
  }

  return (
    <SiteFrame
      site={data.site}
      theme={theme}
      fullBleed
    >
      <EventContent
        event={data.event}
        dates={data.dates}
        site={data.site}
        now={new Date()}
        theme={theme}
      />
    </SiteFrame>
  );
};

export default EventPage;

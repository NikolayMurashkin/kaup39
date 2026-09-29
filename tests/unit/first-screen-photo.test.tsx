import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Photo } from '@/cms/types';
import { FirstScreen } from '@/components/FirstScreen';
import { HERO_QUALITY, HERO_WIDE_QUALITY } from '@/lib/images';
import type { Theme } from '@/lib/types';

const photoOf = (name: string): Photo => ({
  src: `/api/media/file/${name}.jpg`,
  alt: `Кадр ${name}`,
  caption: null,
  width: 2560,
  height: 1704,
  temporary: false,
});

const render = (theme: Theme) =>
  renderToStaticMarkup(
    <FirstScreen
      photos={{ dark: photoOf('night'), light: photoOf('day') }}
      theme={theme}
      title="Поселение эпохи викингов"
      scheduleHref="/raspisanie"
      phone="8 (4012) 00-00-00"
      next={null}
    />,
  );

/** Разметка `<picture>` кадра одной темы. */
const pictureOf = (markup: string, theme: Theme) =>
  markup.match(new RegExp(`<picture [^>]*data-hero-theme="${theme}"[^>]*>.*?</picture>`))?.[0] ?? '';

/** Качество каждого кандидата `srcset` в разметке фрагмента. */
const qualities = (fragment: string) => [...fragment.matchAll(/[?&;]q=(\d+)/g)].map(([, quality]) => Number(quality));

describe('кадр первого экрана: на телефоне легкий, на широком экране без артефактов сжатия', () => {
  const picture = pictureOf(render('dark'), 'dark');

  it('до 640 px включительно браузер берет легкий источник — это LCP мобильного Lighthouse', () => {
    const source = picture.match(/<source [^>]*media="\(max-width: 640px\)"[^>]*>/)?.[0] ?? '';

    expect(source).not.toBe('');
    expect(new Set(qualities(source))).toEqual(new Set([HERO_QUALITY]));
  });

  it('шире 640 px остается кадр `<img>` с качеством для широкого экрана', () => {
    const image = picture.match(/<img [^>]*>/)?.[0] ?? '';

    expect(image).toContain('alt="Кадр night"');
    expect(new Set(qualities(image))).toEqual(new Set([HERO_WIDE_QUALITY]));
  });
});

describe('кадр второй темы уже в разметке: смена темы не ждет перерисовки страницы сервером', () => {
  it.each<[Theme, Theme]>([
    ['dark', 'light'],
    ['light', 'dark'],
  ])('тема %s: свой кадр грузится сразу и первым, кадр темы %s ждет, пока его покажут', (active, other) => {
    const markup = render(active);
    const activeImage = pictureOf(markup, active).match(/<img [^>]*>/)?.[0] ?? '';
    const otherImage = pictureOf(markup, other).match(/<img [^>]*>/)?.[0] ?? '';

    expect(activeImage).toContain('loading="eager"');
    expect(activeImage).toContain('fetchPriority="high"');
    expect(otherImage).toContain('loading="lazy"');
    expect(otherImage).not.toContain('fetchPriority="high"');
  });

  it('порядок кадров не зависит от темы: после смены темы React оставляет те же узлы и кадр не качается заново', () => {
    const order = (markup: string) => [...markup.matchAll(/data-hero-theme="(\w+)"/g)].map(([, theme]) => theme);

    expect(order(render('dark'))).toHaveLength(2);
    expect(order(render('dark'))).toEqual(order(render('light')));
  });
});

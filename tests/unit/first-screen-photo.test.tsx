import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FirstScreen } from '@/components/FirstScreen';
import { HERO_QUALITY, HERO_WIDE_QUALITY } from '@/lib/images';

const markup = renderToStaticMarkup(
  <FirstScreen
    photo={{
      src: '/api/media/file/hero.jpg',
      alt: 'Кадр первого экрана',
      caption: null,
      width: 2560,
      height: 1704,
      temporary: false,
    }}
    title="Поселение эпохи викингов"
    scheduleHref="/raspisanie"
    phone="8 (4012) 00-00-00"
    next={null}
  />,
);

/** Качество каждого кандидата `srcset` в разметке фрагмента. */
const qualities = (fragment: string) => [...fragment.matchAll(/[?&;]q=(\d+)/g)].map(([, quality]) => Number(quality));

describe('кадр первого экрана: на телефоне легкий, на широком экране без артефактов сжатия', () => {
  it('до 640 px включительно браузер берет легкий источник — это LCP мобильного Lighthouse', () => {
    const source = markup.match(/<source [^>]*media="\(max-width: 640px\)"[^>]*>/)?.[0] ?? '';

    expect(source).not.toBe('');
    expect(new Set(qualities(source))).toEqual(new Set([HERO_QUALITY]));
  });

  it('шире 640 px остается кадр `<img>` с качеством для широкого экрана', () => {
    const image = markup.match(/<img [^>]*>/)?.[0] ?? '';

    expect(image).toContain('alt="Кадр первого экрана"');
    expect(new Set(qualities(image))).toEqual(new Set([HERO_WIDE_QUALITY]));
  });
});

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { HeroVideoSources, Photo } from '@/cms/types';
import { FirstScreen, type FirstScreenProps } from '@/components/FirstScreen';
import { HeroVideoPlayer } from '@/components/FirstScreen/HeroVideo';
import { heroPoster } from '@/components/FirstScreen/video';
import { HERO_WIDE_QUALITY } from '@/lib/images';
import type { Theme } from '@/lib/types';

const photoOf = (name: string): Photo => ({
  src: `/api/media/file/${name}.jpg`,
  alt: `Кадр ${name}`,
  caption: null,
  width: 2560,
  height: 1704,
  temporary: false,
});

const MP4_URL = '/api/media/file/loop.mp4';
const WEBM_URL = '/api/media/file/loop.webm';
const VIDEO: HeroVideoSources = { mp4: MP4_URL, webm: WEBM_URL };
const POSTER = '/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fnight.jpg&w=1920&q=75';
const PHOTOS = { dark: photoOf('night'), light: photoOf('day') };

const renderScreen = (props: Partial<FirstScreenProps> = {}, theme: Theme = 'dark') =>
  renderToStaticMarkup(
    <FirstScreen
      photos={PHOTOS}
      theme={theme}
      title="Поселение эпохи викингов"
      scheduleHref="/raspisanie"
      phone="8 (4012) 00-00-00"
      next={null}
      {...props}
    />,
  );

const renderPlayer = (video: HeroVideoSources = VIDEO, paused = false) =>
  renderToStaticMarkup(
    <HeroVideoPlayer
      video={video}
      poster={POSTER}
      paused={paused}
      onToggle={() => undefined}
    />,
  );

/** Открывающие теги элемента в разметке. */
const tagsOf = (markup: string, name: string) =>
  [...markup.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(([tag]) => tag);

/** Значение атрибута тега с раскрытыми HTML-сущностями `&amp;`; атрибута нет — `null`. */
const attrOf = (tag: string, name: string) => {
  const value = tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1];

  return value === undefined ? null : value.replaceAll('&amp;', '&');
};

/** Есть ли у тега булев атрибут, без учета регистра: React пишет `playsInline`, `autoPlay`. */
const hasAttr = (tag: string, name: string) => new RegExp(`\\s${name}(=|\\s|/?>)`, 'i').test(tag);

/** Разметка `<picture>` кадра одной темы. */
const pictureOf = (markup: string, theme: Theme) =>
  markup.match(new RegExp(`<picture [^>]*data-hero-theme="${theme}"[^>]*>.*?</picture>`))?.[0] ?? '';

describe('плеер видео первого экрана: без звука, на телефоне без полноэкранного режима, постер — кадр', () => {
  it('один <video> без звука, inline, по кругу, сам стартует, без панели управления и скрыт от чтения с экрана', () => {
    const videos = tagsOf(renderPlayer(), 'video');

    expect(videos).toHaveLength(1);

    const [video] = videos;

    expect(hasAttr(video, 'muted')).toBe(true);
    expect(hasAttr(video, 'playsinline')).toBe(true);
    expect(hasAttr(video, 'loop')).toBe(true);
    expect(hasAttr(video, 'autoplay')).toBe(true);
    expect(hasAttr(video, 'controls')).toBe(false);
    expect(attrOf(video, 'aria-hidden')).toBe('true');
  });

  it('постер — переданный адрес кадра', () => {
    const [video] = tagsOf(renderPlayer(), 'video');

    expect(attrOf(video ?? '', 'poster')).toBe(POSTER);
  });

  it('источники: WebM первым, затем MP4, у каждого тип; только один файл — один источник', () => {
    const sources = (video: HeroVideoSources) =>
      tagsOf(renderPlayer(video), 'source').map((tag) => [attrOf(tag, 'src'), attrOf(tag, 'type')]);

    expect(sources(VIDEO)).toEqual([
      [WEBM_URL, 'video/webm'],
      [MP4_URL, 'video/mp4'],
    ]);
    expect(sources({ mp4: MP4_URL, webm: null })).toEqual([[MP4_URL, 'video/mp4']]);
    expect(sources({ mp4: null, webm: WEBM_URL })).toEqual([[WEBM_URL, 'video/webm']]);
  });

  it('кнопка паузы с доступным названием, которое называет действие и меняется с состоянием', () => {
    const buttonOf = (paused: boolean) => {
      const buttons = tagsOf(renderPlayer(VIDEO, paused), 'button');

      expect(buttons).toHaveLength(1);
      expect(attrOf(buttons[0], 'type')).toBe('button');

      return attrOf(buttons[0], 'aria-label')?.trim() ?? '';
    };
    const playing = buttonOf(false);
    const paused = buttonOf(true);

    expect(playing).not.toBe('');
    expect(paused).not.toBe('');
    expect(playing).not.toBe(paused);
  });
});

describe('первый экран с видео: кадр остается постером и LCP, без видео — как раньше', () => {
  it('без видео в CMS разметка та же, что без пропа: ни видео, ни кнопки', () => {
    const bare = renderScreen();

    expect(renderScreen({ video: null })).toBe(bare);
    expect(bare).not.toContain('<video');
    expect(bare).not.toContain('<button');
  });

  it('с видео сервер отдает только кадр: видео появляется в браузере после загрузки страницы', () => {
    const markup = renderScreen({ video: VIDEO });
    const activeImage = pictureOf(markup, 'dark').match(/<img [^>]*>/)?.[0] ?? '';

    expect(markup).not.toContain('<video');
    expect(markup).not.toMatch(/<source [^>]*type="video\//);
    expect(activeImage).toContain('loading="eager"');
    expect(activeImage).toContain('fetchPriority="high"');
  });

  it('постер — тот же файл оптимизатора, что и широкий кадр: лишний файл не качается', () => {
    const photo = photoOf('night');
    const image =
      pictureOf(renderScreen({ photos: { dark: photo, light: null } }), 'dark').match(/<img [^>]*>/)?.[0] ?? '';
    const candidates = (attrOf(image, 'srcSet') ?? '').split(', ').map((candidate) => candidate.split(' ')[0]);
    const poster = heroPoster(photo);

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates).toContain(poster);
    expect(new URL(poster, 'http://localhost').searchParams.get('q')).toBe(String(HERO_WIDE_QUALITY));
  });

  it('видео есть, а кадра темы нет — видео не рисуется: без кадра LCP стал бы видео', () => {
    const markup = renderScreen({ video: VIDEO, photos: { dark: null, light: null } });

    expect(markup).toContain('id="first-screen-title"');
    expect(markup).not.toContain('<video');
  });
});

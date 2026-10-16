'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { HeroVideoSources } from '@/cms/types';
import { HERO_VIDEO_TYPES } from '@/cms/consts';
import { IconButton } from '../IconButton';
import { HERO_THEME_ATTR, HERO_VIDEO_LABELS } from './consts';
import { canPlayHeroVideo } from './video';
import styles from './HeroVideo.module.scss';

export type HeroVideoProps = {
  video: HeroVideoSources;
  /** Запасной постер — адрес широкого кадра от сервера, если кадр в браузере еще не выбрал файл. */
  poster?: string;
};

export type HeroVideoPlayerProps = {
  video: HeroVideoSources;
  poster?: string;
  paused: boolean;
  onToggle: () => void;
  /** Браузер не дал запустить видео (автозапуск запрещен): плеер встает на паузу, кнопка предлагает включить. */
  onRefuse?: () => void;
  /** Ни один файл не отдался или не подошел браузеру: плеер снимается, остается кадр. */
  onFail?: () => void;
};

/**
 * Петля поверх кадра и кнопка паузы. Видео декоративное и без звука: смысл несут кадр и плашка, поэтому оно скрыто
 * от чтения с экрана, а `playsInline` не дает телефону развернуть его на весь экран. WebM первым — он легче,
 * MP4 (H.264) — для браузеров без WebM. До первого кадра видео прозрачно и проявляется по `playing`: пустой
 * или еще не начавшийся плеер кадр не закрывает.
 */
export const HeroVideoPlayer = ({ video, poster, paused, onToggle, onRefuse, onFail }: HeroVideoPlayerProps) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const sources = [
    video.webm ? { src: video.webm, type: HERO_VIDEO_TYPES.webm } : null,
    video.mp4 ? { src: video.mp4, type: HERO_VIDEO_TYPES.mp4 } : null,
  ].filter((source) => source !== null);

  // React ставит `muted` свойством уже после вставки узла, и `autoplay` браузер мог отклонить: запуск — еще и здесь
  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    if (paused) {
      element.pause();
    } else {
      element.play().catch(() => onRefuse?.());
    }
  }, [paused, onRefuse]);

  return (
    <>
      <video
        ref={ref}
        className={styles.video}
        poster={poster}
        muted
        playsInline
        loop
        autoPlay
        aria-hidden="true"
        data-playing={playing ? '' : undefined}
        onPlaying={() => setPlaying(true)}
        onError={onFail}
      >
        {sources.map(({ src, type }, index) => (
          <source
            key={type}
            src={src}
            type={type}
            onError={index === sources.length - 1 ? onFail : undefined}
          />
        ))}
      </video>
      <IconButton
        className={styles.pause}
        icon={paused ? 'play' : 'pause'}
        label={paused ? HERO_VIDEO_LABELS.play : HERO_VIDEO_LABELS.pause}
        onClick={onToggle}
      />
    </>
  );
};

/** Файл, который браузер уже взял для кадра текущей темы: постер из кеша, без лишнего запроса и в плотности экрана. */
const shownPhotoSrc = () =>
  document.querySelector<HTMLImageElement>(`[${HERO_THEME_ATTR}="${document.documentElement.dataset.theme}"] img`)
    ?.currentSrc || undefined;

/**
 * Видео первого экрана включается после загрузки страницы: кадр остается LCP, а файл видео не спорит с ним за канал.
 * Условие проверяется один раз: окно сузили после старта — плеер остается, а до 640 px его прячут стили.
 * На сервере и до `load` ничего нет; файлы не отдались — плеер снимается насовсем.
 */
export const HeroVideo = ({ video, poster }: HeroVideoProps) => {
  const [started, setStarted] = useState<{ poster?: string } | null>(null);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const pause = useCallback(() => setPaused(true), []);

  useEffect(() => {
    const start = () => {
      if (canPlayHeroVideo(window)) {
        setStarted({ poster: shownPhotoSrc() ?? poster });
      }
    };

    if (document.readyState === 'complete') {
      const frame = requestAnimationFrame(start);

      return () => cancelAnimationFrame(frame);
    }

    window.addEventListener('load', start, { once: true });

    return () => window.removeEventListener('load', start);
  }, [poster]);

  return started && !failed ? (
    <HeroVideoPlayer
      video={video}
      poster={started.poster}
      paused={paused}
      onToggle={() => setPaused((value) => !value)}
      onRefuse={pause}
      onFail={() => setFailed(true)}
    />
  ) : null;
};

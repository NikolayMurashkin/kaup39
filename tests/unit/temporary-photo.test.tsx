import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Photo } from '@/cms/types';
import { FirstScreen } from '@/components/FirstScreen';
import { PhotoViewer } from '@/components/PhotoViewer';
import { PlaceCard } from '@/components/PlaceCard';

/** Подпись временного чужого кадра (D31). */
const NOTE = 'фото для примера';

const photo = (temporary: boolean): Photo => ({
  src: '/api/media/file/test.jpg',
  alt: 'Кадр для теста',
  caption: 'Подпись кадра',
  width: 1600,
  height: 1000,
  temporary,
});

/** Где кадр виден: на странице и в диалоге, который открывает кадр или карточка. */
type Place = 'страница' | 'диалог';

const VIEWS: [string, (shot: Photo) => ReactElement, Place[]][] = [
  [
    'карточка',
    (shot) => (
      <PlaceCard
        name="Кузница"
        number={2}
        mark="forge"
        photo={shot}
        action="Подробнее"
      >
        Текст диалога
      </PlaceCard>
    ),
    ['страница', 'диалог'],
  ],
  [
    'первый экран',
    (shot) => (
      <FirstScreen
        photo={shot}
        title="Поселение эпохи викингов"
        scheduleHref="/raspisanie"
        phone="8 (4012) 00-00-00"
        next={null}
      />
    ),
    ['страница'],
  ],
  [
    'просмотр фото',
    (shot) => (
      <PhotoViewer
        label="Галерея"
        photos={[shot]}
      />
    ),
    ['страница', 'диалог'],
  ],
];

/** Разметка до диалога — то, что видно на странице, с `<dialog>` и дальше — содержимое диалога. */
const split = (markup: string): Record<Place, string> => {
  const dialog = markup.indexOf('<dialog');

  return dialog === -1
    ? { страница: markup, диалог: '' }
    : { страница: markup.slice(0, dialog), диалог: markup.slice(dialog) };
};

describe('временный кадр подписан «фото для примера» (D31)', () => {
  it.each(VIEWS)('%s: у временного кадра подпись есть везде, где виден кадр', (_, view, places) => {
    const parts = split(renderToStaticMarkup(view(photo(true))));

    for (const place of places) {
      expect(parts[place], place).toContain(NOTE);
    }
  });

  it.each(VIEWS)('%s: у своего кадра подписи нет', (_, view) => {
    expect(renderToStaticMarkup(view(photo(false)))).not.toContain(NOTE);
  });
});

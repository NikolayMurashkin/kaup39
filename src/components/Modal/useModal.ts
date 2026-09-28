import { useRef } from 'react';

/** Открывает окно `Modal` от кнопки, закрывает его и возвращает фокус на эту кнопку, когда окно закрылось. */
export const useModal = () => {
  const ref = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const open = (opener: HTMLElement) => {
    openerRef.current = opener;
    ref.current?.showModal();
  };

  const close = () => ref.current?.close();

  const restoreFocus = () => openerRef.current?.focus();

  return { ref, open, close, restoreFocus };
};

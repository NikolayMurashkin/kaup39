'use client';

import type { KeyboardEvent, MouseEvent, ReactNode, RefObject } from 'react';
import styles from './Modal.module.scss';

export type ModalProps = {
  ref: RefObject<HTMLDialogElement | null>;
  /** Имя окна для скринридера. */
  label: string;
  /** Окно просмотра фото: шире окна с текстом. */
  wide?: boolean;
  onClose: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDialogElement>) => void;
  children: ReactNode;
};

/**
 * Окно на нативном `<dialog>`: затемнение, тесаные углы, на телефоне — лист снизу; клик по затемнению закрывает.
 * Открывает его и возвращает фокус на кнопку `useModal`.
 */
export const Modal = ({ ref, label, wide = false, onClose, onKeyDown, children }: ModalProps) => {
  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      event.currentTarget.close();
    }
  };

  return (
    <dialog
      ref={ref}
      className={[styles.modal, wide ? styles.wide : null].filter(Boolean).join(' ')}
      aria-label={label}
      onClose={onClose}
      onClick={closeOnBackdrop}
      onKeyDown={onKeyDown}
    >
      {children}
    </dialog>
  );
};

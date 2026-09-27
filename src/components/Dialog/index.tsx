'use client';

import { type MouseEvent, type ReactNode, useRef } from 'react';
import type { IconName } from '../Icon/types';
import { IconButton } from '../IconButton';
import styles from './Dialog.module.scss';

export type DialogProps = {
  /** Содержимое кнопки, которая открывает диалог: текст или карточка. */
  trigger?: ReactNode;
  /** Вместо содержимого — квадратная кнопка со значком, как кнопка меню в шапке. */
  triggerIcon?: IconName;
  triggerClassName?: string;
  /** Подпись кнопки для скринридера, когда на ней нет текста; у кнопки со значком обязательна. */
  triggerLabel?: string;
  /** Имя диалога для скринридера. */
  label: string;
  /** Левая часть липкой шапки диалога: название, вордмарк. */
  heading?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Диалог направления на нативном `<dialog>`: фокус переходит внутрь, Esc и крестик закрывают, клик по затемнению
 * тоже, фокус возвращается на кнопку, которая его открыла. На широком — окно по центру, на телефоне — лист снизу.
 */
export const Dialog = ({
  trigger,
  triggerIcon,
  triggerClassName,
  triggerLabel,
  label,
  heading,
  children,
  className,
}: DialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const open = (event: MouseEvent<HTMLButtonElement>) => {
    openerRef.current = event.currentTarget;
    dialogRef.current?.showModal();
  };

  const close = () => dialogRef.current?.close();

  const restoreFocus = () => openerRef.current?.focus();

  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      close();
    }
  };

  return (
    <>
      {triggerIcon ? (
        <IconButton
          icon={triggerIcon}
          label={triggerLabel ?? label}
          className={triggerClassName}
          opensDialog
          onClick={open}
        />
      ) : (
        <button
          className={triggerClassName}
          type="button"
          aria-label={triggerLabel}
          aria-haspopup="dialog"
          onClick={open}
        >
          {trigger}
        </button>
      )}

      <dialog
        ref={dialogRef}
        className={[styles.dialog, className].filter(Boolean).join(' ')}
        aria-label={label}
        onClose={restoreFocus}
        onClick={closeOnBackdrop}
      >
        <div className={styles.head}>
          <div className={styles.heading}>{heading}</div>
          <IconButton
            icon="close"
            label="Закрыть"
            className={styles.close}
            onClick={close}
          />
        </div>

        <div className={styles.body}>{children}</div>
      </dialog>
    </>
  );
};

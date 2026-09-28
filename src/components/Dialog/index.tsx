'use client';

import type { MouseEvent, ReactNode } from 'react';
import type { IconName } from '../Icon/types';
import { IconButton } from '../IconButton';
import { Modal } from '../Modal';
import { useModal } from '../Modal/useModal';
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
}: DialogProps) => {
  const { ref: modalRef, open: openModal, close: closeModal, restoreFocus } = useModal();

  const open = (event: MouseEvent<HTMLButtonElement>) => openModal(event.currentTarget);

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

      <Modal
        ref={modalRef}
        label={label}
        onClose={restoreFocus}
      >
        <div className={styles.head}>
          <div className={styles.heading}>{heading}</div>
          <IconButton
            icon="close"
            label="Закрыть"
            className={styles.close}
            onClick={closeModal}
          />
        </div>

        <div className={styles.body}>{children}</div>
      </Modal>
    </>
  );
};

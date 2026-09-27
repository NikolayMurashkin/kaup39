import type { MouseEvent } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../Icon/types';
import styles from './IconButton.module.scss';

export type IconButtonProps = {
  icon: IconName;
  /** Что делает кнопка — для скринридера: на кнопке только значок. */
  label: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  /** Кнопка открывает диалог: скринридер предупредит об этом. */
  opensDialog?: boolean;
};

/** Квадратная кнопка со значком и тесаными углами — крестик диалога, стрелки просмотра, кнопка меню. */
export const IconButton = ({ icon, label, onClick, className, opensDialog = false }: IconButtonProps) => (
  <button
    className={[styles.button, className].filter(Boolean).join(' ')}
    type="button"
    aria-label={label}
    aria-haspopup={opensDialog ? 'dialog' : undefined}
    onClick={onClick}
  >
    <Icon name={icon} />
  </button>
);

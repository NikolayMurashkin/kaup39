import type { MouseEvent } from 'react';
import { Icon } from '../Icon';
import type { IconName } from '../Icon/types';
import styles from './IconButton.module.scss';

export type IconButtonProps = {
  icon: IconName;
  /** Что делает кнопка — для скринридера: на кнопке только значок. */
  label: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Наведение или фокус — пользователь, скорее всего, сейчас нажмет: можно заранее начать загрузку. */
  onIntent?: () => void;
  className?: string;
  /** Кнопка открывает диалог: скринридер предупредит об этом. */
  opensDialog?: boolean;
};

/** Квадратная кнопка со значком и тесаными углами — крестик диалога, стрелки просмотра, кнопка меню. */
export const IconButton = ({ icon, label, onClick, onIntent, className, opensDialog = false }: IconButtonProps) => (
  <button
    className={[styles.button, className].filter(Boolean).join(' ')}
    type="button"
    aria-label={label}
    aria-haspopup={opensDialog ? 'dialog' : undefined}
    onClick={onClick}
    onPointerEnter={onIntent}
    onFocus={onIntent}
  >
    <Icon name={icon} />
  </button>
);

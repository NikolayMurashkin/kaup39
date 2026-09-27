import { TEMPORARY_PHOTO_NOTE } from './consts';
import styles from './PhotoNote.module.scss';

export type PhotoNoteProps = {
  className?: string;
};

/** Подпись «фото для примера» поверх временного кадра — на вуали, чтобы держать контраст на любом снимке. */
export const PhotoNote = ({ className }: PhotoNoteProps) => (
  <span className={[styles.note, className].filter(Boolean).join(' ')}>{TEMPORARY_PHOTO_NOTE}</span>
);

import { IRON_GRAIN_ID, WOOD_GRAIN_ID } from '../SvgDefs/consts';
import styles from './Grain.module.scss';
import type { GrainKind } from './types';

export type GrainProps = {
  /** Волокно дерева тянется по вертикали, зерно железа мелкое и равномерное. */
  kind?: GrainKind;
};

export const Grain = ({ kind = 'wood' }: GrainProps) => (
  <svg
    className={styles.grain}
    aria-hidden="true"
  >
    <rect
      width="100%"
      height="100%"
      filter={`url(#${kind === 'wood' ? WOOD_GRAIN_ID : IRON_GRAIN_ID})`}
    />
  </svg>
);

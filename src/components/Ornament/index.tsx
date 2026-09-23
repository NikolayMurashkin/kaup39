import { RING_CHAIN_ID, RING_CHAIN_V_ID } from '../SvgDefs/consts';
import styles from './Ornament.module.scss';
import type { OrnamentDirection } from './types';

export type OrnamentProps = {
  /** Как ложится кольцевая цепь борре: лентой поперек или полосой вдоль края. */
  direction?: OrnamentDirection;
  className?: string;
};

export const Ornament = ({ direction = 'horizontal', className }: OrnamentProps) => (
  <svg
    className={[styles.ornament, styles[direction], className].filter(Boolean).join(' ')}
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <rect
      width="100%"
      height="100%"
      fill={`url(#${direction === 'horizontal' ? RING_CHAIN_ID : RING_CHAIN_V_ID})`}
    />
  </svg>
);

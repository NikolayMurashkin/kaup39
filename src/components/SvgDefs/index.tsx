import { IRON_GRAIN_ID, RING_CHAIN_ID, RING_CHAIN_V_ID, WOOD_GRAIN_ID } from './consts';
import styles from './SvgDefs.module.scss';

/**
 * Орнаменты и текстуры направления одним спрайтом: кольцевая цепь борре двух направлений и
 * процедурное зерно дерева и железа. Рисуется один раз на страницу, компоненты ссылаются на
 * идентификаторы. Зерно — `feTurbulence`, а не картинка: оно ничего не весит и не пикселится.
 */
export const SvgDefs = () => (
  <svg
    className={styles.defs}
    width="0"
    height="0"
  >
    <defs>
      <pattern
        id={RING_CHAIN_ID}
        width="48"
        height="26"
        patternUnits="userSpaceOnUse"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <circle
            cx="12"
            cy="13"
            r="9.5"
          />
          <circle
            cx="12"
            cy="13"
            r="5"
          />
          <circle
            cx="36"
            cy="13"
            r="9.5"
          />
          <circle
            cx="36"
            cy="13"
            r="5"
          />
          <path d="M24 1.5v23M18 13l6-6 6 6-6 6z" />
          <path d="M0 13h2.5M45.5 13H48" />
        </g>
      </pattern>

      <pattern
        id={RING_CHAIN_V_ID}
        width="26"
        height="48"
        patternUnits="userSpaceOnUse"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <circle
            cx="13"
            cy="12"
            r="9.5"
          />
          <circle
            cx="13"
            cy="12"
            r="5"
          />
          <circle
            cx="13"
            cy="36"
            r="9.5"
          />
          <circle
            cx="13"
            cy="36"
            r="5"
          />
          <path d="M1.5 24h23M13 18l6 6-6 6-6-6z" />
        </g>
      </pattern>

      <filter
        id={WOOD_GRAIN_ID}
        x="0"
        y="0"
        width="100%"
        height="100%"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.006 0.44"
          numOctaves="4"
          seed="9"
          result="n"
        />
        <feColorMatrix
          in="n"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.1 0 0 0 -0.22"
        />
      </filter>

      <filter
        id={IRON_GRAIN_ID}
        x="0"
        y="0"
        width="100%"
        height="100%"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.7 0.7"
          numOctaves="3"
          seed="4"
          result="n"
        />
        <feColorMatrix
          in="n"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.8 0 0 0 -0.32"
        />
      </filter>
    </defs>
  </svg>
);

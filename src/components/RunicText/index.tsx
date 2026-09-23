import { CAP_HEIGHT } from './alphabet';
import { DEEP_CLASS, FACE_CLASS, OVERHANG, PAD } from './consts';
import { runicPath } from './path';
import styles from './RunicText.module.scss';
import type { RunicSize } from './types';

export type RunicTextProps = {
  children: string;
  /** Кегль надписи: первый экран, заголовок секции или вордмарк. */
  size?: RunicSize;
  className?: string;
};

export const RunicText = ({ children, size = 'title', className }: RunicTextProps) => {
  const { d, width } = runicPath(children);
  const box = `${-PAD} ${-PAD - 4} ${width + PAD * 2} ${CAP_HEIGHT + PAD * 2 + OVERHANG}`;

  return (
    <span className={[styles.runic, styles[size], className].filter(Boolean).join(' ')}>
      <span className={styles.source}>{children}</span>

      <svg
        className={styles.glyphs}
        viewBox={box}
        data-runic={children}
        focusable="false"
      >
        <path
          className={DEEP_CLASS}
          d={d}
        />
        <path
          className={FACE_CLASS}
          d={d}
        />
      </svg>
    </span>
  );
};

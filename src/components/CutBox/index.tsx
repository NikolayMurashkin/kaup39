import type { ElementType, ReactNode } from 'react';
import styles from './CutBox.module.scss';
import type { CutShadow, CutSize, CutSurface } from './types';

export type CutBoxProps = {
  children: ReactNode;
  /** Насколько глубоко стесаны углы: `--cut-sm`, `--cut-md` или `--cut-lg`. */
  cut?: CutSize;
  surface?: CutSurface;
  /** Тень идет через `drop-shadow`, потому что `box-shadow` рисуется по прямоугольнику, а не по срезу. */
  shadow?: CutShadow;
  /** Обводка в один пиксель: у срезанной формы она делается вторым слоем, а не `border`. */
  bordered?: boolean;
  as?: ElementType;
  className?: string;
};

export const CutBox = ({
  children,
  cut = 'md',
  surface = 'surface',
  shadow = 'none',
  bordered = false,
  as: Tag = 'div',
  className,
}: CutBoxProps) => (
  <Tag
    className={[
      styles.box,
      styles[`cut-${cut}`],
      styles[`surface-${surface}`],
      shadow === 'none' ? null : styles[`shadow-${shadow}`],
      bordered ? styles.bordered : null,
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </Tag>
);

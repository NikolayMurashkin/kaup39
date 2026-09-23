export type RunicLetter = {
  /** Ширина знака в единицах сетки алфавита. */
  width: number;
  /** Полилинии знака: каждая — список точек, соединенных отрезками. */
  lines: [number, number][][];
};

export type RunicSize = 'hero' | 'title' | 'mark';

export type RunicPath = {
  /** Значение атрибута `d` для `<path>`. */
  d: string;
  /** Ширина набранной строки в единицах сетки алфавита. */
  width: number;
};

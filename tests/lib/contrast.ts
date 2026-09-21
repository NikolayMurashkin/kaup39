export type Rgb = [number, number, number];

export const MIN_RATIO = 4.5;

export const parseHex = (value: string): Rgb | null => {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());

  if (!hex) {
    return null;
  }

  const raw = hex[1].length === 3 ? [...hex[1]].map((channel) => channel + channel).join('') : hex[1];

  return [0, 2, 4].map((index) => parseInt(raw.slice(index, index + 2), 16)) as Rgb;
};

export const luminance = ([r, g, b]: Rgb) => {
  const channel = (value: number) => {
    const part = value / 255;

    return part <= 0.03928 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const contrast = (foreground: Rgb, background: Rgb) => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((first, second) => second - first);

  return (lighter + 0.05) / (darker + 0.05);
};

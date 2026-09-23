declare module 'fontverter' {
  type FontFormat = 'sfnt' | 'truetype' | 'woff' | 'woff2';

  const fontverter: {
    convert: (font: Buffer, toFormat: FontFormat, fromFormat?: FontFormat) => Promise<Buffer>;
  };

  export default fontverter;
}

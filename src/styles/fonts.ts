import localFont from 'next/font/local';

export const ponomar = localFont({
  src: './fonts/ponomar.woff2',
  weight: '400',
  display: 'swap',
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Ponomar' }],
});

export const forum = localFont({
  src: './fonts/forum.woff2',
  weight: '400',
  display: 'swap',
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Forum' }],
});

export const golosText = localFont({
  src: './fonts/golos-text.woff2',
  weight: '400 600',
  display: 'swap',
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Golos Text' }],
});

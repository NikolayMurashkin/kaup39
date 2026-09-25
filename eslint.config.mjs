import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: [
      '.next/**',
      '.next-production/**',
      'node_modules/**',
      '.lighthouseci/**',
      'playwright-report/**',
      'test-results/**',
      'src/app/(payload)/**',
      'src/payload-types.ts',
      'src/migrations/**',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    },
  },
];

export default config;

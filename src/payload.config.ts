import { postgresAdapter } from '@payloadcms/db-postgres';
import { ru } from '@payloadcms/translations/languages/ru';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Users } from './cms/collections/Users';
import { COLLECTIONS, GLOBALS } from './cms/schema';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: { titleSuffix: ' · Кауп, CMS' },
  },
  collections: COLLECTIONS,
  globals: GLOBALS,
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL } }),
  graphQL: { disable: true },
  i18n: { fallbackLanguage: 'ru', supportedLanguages: { ru } },
  secret: process.env.PAYLOAD_SECRET ?? '',
  sharp,
  telemetry: false,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
});

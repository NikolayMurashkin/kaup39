import { postgresAdapter } from '@payloadcms/db-postgres';
import { ru } from '@payloadcms/translations/languages/ru';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Users } from './cms/collections/Users';
import { COLLECTIONS, GLOBALS } from './cms/schema';
import { migrations } from './migrations';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: { titleSuffix: ' · Кауп, CMS' },
  },
  collections: COLLECTIONS,
  globals: GLOBALS,
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Только у баз, которые ведутся миграциями: стенд (флаг задан в образе) и e2e. Рабочая база разработки
    // создана push режима разработки, и на ней Payload спросил бы в терминале, можно ли терять данные.
    prodMigrations: process.env.MIGRATE_ON_START === 'true' ? migrations : undefined,
  }),
  graphQL: { disable: true },
  i18n: { fallbackLanguage: 'ru', supportedLanguages: { ru } },
  secret: process.env.PAYLOAD_SECRET ?? '',
  sharp,
  telemetry: false,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
});

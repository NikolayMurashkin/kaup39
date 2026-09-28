import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_slug" ADD VALUE 'camping' BEFORE 'corporate';
  ALTER TABLE "events" ADD COLUMN "photo_id" integer;
  ALTER TABLE "pages" ADD COLUMN "teaser_title" varchar;
  ALTER TABLE "pages" ADD COLUMN "teaser_text" varchar;
  ALTER TABLE "pages" ADD COLUMN "teaser_action" varchar;
  ALTER TABLE "pages" ADD COLUMN "teaser_photo_id" integer;
  ALTER TABLE "events" ADD CONSTRAINT "events_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_teaser_photo_id_media_id_fk" FOREIGN KEY ("teaser_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "events_photo_idx" ON "events" USING btree ("photo_id");
  CREATE INDEX "pages_teaser_teaser_photo_idx" ON "pages" USING btree ("teaser_photo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" DROP CONSTRAINT "events_photo_id_media_id_fk";
  
  ALTER TABLE "pages" DROP CONSTRAINT "pages_teaser_photo_id_media_id_fk";
  
  ALTER TABLE "pages" ALTER COLUMN "slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_slug";
  CREATE TYPE "public"."enum_pages_slug" AS ENUM('home', 'directions', 'corporate');
  ALTER TABLE "pages" ALTER COLUMN "slug" SET DATA TYPE "public"."enum_pages_slug" USING "slug"::"public"."enum_pages_slug";
  DROP INDEX "events_photo_idx";
  DROP INDEX "pages_teaser_teaser_photo_idx";
  ALTER TABLE "events" DROP COLUMN "photo_id";
  ALTER TABLE "pages" DROP COLUMN "teaser_title";
  ALTER TABLE "pages" DROP COLUMN "teaser_text";
  ALTER TABLE "pages" DROP COLUMN "teaser_action";
  ALTER TABLE "pages" DROP COLUMN "teaser_photo_id";`)
}

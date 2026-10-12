import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" ADD COLUMN "hero_id" integer;
  ALTER TABLE "events" ADD CONSTRAINT "events_hero_id_media_id_fk" FOREIGN KEY ("hero_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "events_hero_idx" ON "events" USING btree ("hero_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" DROP CONSTRAINT "events_hero_id_media_id_fk";
  
  DROP INDEX "events_hero_idx";
  ALTER TABLE "events" DROP COLUMN "hero_id";`)
}

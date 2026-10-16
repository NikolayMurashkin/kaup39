import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ADD COLUMN "hero_video_mp4_id" integer;
  ALTER TABLE "pages" ADD COLUMN "hero_video_webm_id" integer;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_video_mp4_id_media_id_fk" FOREIGN KEY ("hero_video_mp4_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_video_webm_id_media_id_fk" FOREIGN KEY ("hero_video_webm_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_hero_hero_video_mp4_idx" ON "pages" USING btree ("hero_video_mp4_id");
  CREATE INDEX "pages_hero_hero_video_webm_idx" ON "pages" USING btree ("hero_video_webm_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP CONSTRAINT "pages_hero_video_mp4_id_media_id_fk";
  
  ALTER TABLE "pages" DROP CONSTRAINT "pages_hero_video_webm_id_media_id_fk";
  
  DROP INDEX "pages_hero_hero_video_mp4_idx";
  DROP INDEX "pages_hero_hero_video_webm_idx";
  ALTER TABLE "pages" DROP COLUMN "hero_video_mp4_id";
  ALTER TABLE "pages" DROP COLUMN "hero_video_webm_id";`)
}

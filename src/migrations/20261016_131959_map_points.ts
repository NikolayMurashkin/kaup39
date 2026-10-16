import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "map_points" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" numeric NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"x" numeric NOT NULL,
  	"y" numeric NOT NULL,
  	"photo_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "map_points_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"zones_id" integer,
  	"taverns_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "map_points_id" integer;
  ALTER TABLE "map_points" ADD CONSTRAINT "map_points_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "map_points_rels" ADD CONSTRAINT "map_points_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."map_points"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "map_points_rels" ADD CONSTRAINT "map_points_rels_zones_fk" FOREIGN KEY ("zones_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "map_points_rels" ADD CONSTRAINT "map_points_rels_taverns_fk" FOREIGN KEY ("taverns_id") REFERENCES "public"."taverns"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "map_points_slug_idx" ON "map_points" USING btree ("slug");
  CREATE INDEX "map_points_photo_idx" ON "map_points" USING btree ("photo_id");
  CREATE INDEX "map_points_updated_at_idx" ON "map_points" USING btree ("updated_at");
  CREATE INDEX "map_points_created_at_idx" ON "map_points" USING btree ("created_at");
  CREATE INDEX "map_points_rels_order_idx" ON "map_points_rels" USING btree ("order");
  CREATE INDEX "map_points_rels_parent_idx" ON "map_points_rels" USING btree ("parent_id");
  CREATE INDEX "map_points_rels_path_idx" ON "map_points_rels" USING btree ("path");
  CREATE INDEX "map_points_rels_zones_id_idx" ON "map_points_rels" USING btree ("zones_id");
  CREATE INDEX "map_points_rels_taverns_id_idx" ON "map_points_rels" USING btree ("taverns_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_map_points_fk" FOREIGN KEY ("map_points_id") REFERENCES "public"."map_points"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_map_points_id_idx" ON "payload_locked_documents_rels" USING btree ("map_points_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "map_points" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "map_points_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "map_points" CASCADE;
  DROP TABLE "map_points_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_map_points_fk";
  
  DROP INDEX "payload_locked_documents_rels_map_points_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "map_points_id";`)
}

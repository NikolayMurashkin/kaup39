import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_phone" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"phone" varchar NOT NULL,
  	"person" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_phone" ADD CONSTRAINT "pages_blocks_phone_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_phone_order_idx" ON "pages_blocks_phone" USING btree ("_order");
  CREATE INDEX "pages_blocks_phone_parent_id_idx" ON "pages_blocks_phone" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_phone_path_idx" ON "pages_blocks_phone" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_phone" CASCADE;`)
}

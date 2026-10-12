import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "events_perks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "site_refund_terms" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"when" varchar NOT NULL,
  	"share" varchar NOT NULL
  );
  
  ALTER TABLE "events_perks" ADD CONSTRAINT "events_perks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_refund_terms" ADD CONSTRAINT "site_refund_terms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_perks_order_idx" ON "events_perks" USING btree ("_order");
  CREATE INDEX "events_perks_parent_id_idx" ON "events_perks" USING btree ("_parent_id");
  CREATE INDEX "site_refund_terms_order_idx" ON "site_refund_terms" USING btree ("_order");
  CREATE INDEX "site_refund_terms_parent_id_idx" ON "site_refund_terms" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "events_perks" CASCADE;
  DROP TABLE "site_refund_terms" CASCADE;`)
}

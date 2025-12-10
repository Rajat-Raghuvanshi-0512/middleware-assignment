CREATE TABLE "user_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"facts" jsonb DEFAULT '[]' NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_memory_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE INDEX "user_memory_user_id_idx" ON "user_memory" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_memory_updated_at_idx" ON "user_memory" USING btree ("updated_at");
CREATE TABLE IF NOT EXISTS "telegram_link_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "token_hash" varchar(64) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "telegram_link_sessions_token_hash_unique" UNIQUE("token_hash")
);

DO $$
BEGIN
  ALTER TABLE "telegram_link_sessions"
    ADD CONSTRAINT "telegram_link_sessions_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "telegram_link_sessions_user_id_idx"
  ON "telegram_link_sessions" ("user_id");
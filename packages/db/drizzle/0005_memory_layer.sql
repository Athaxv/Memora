CREATE TYPE "public"."artifact_type" AS ENUM('note', 'link', 'document', 'message', 'idea', 'media', 'chat_turn');--> statement-breakpoint
CREATE TYPE "public"."memory_tier" AS ENUM('short_term', 'long_term', 'personality');--> statement-breakpoint
CREATE TYPE "public"."memory_kind" AS ENUM('fact', 'preference', 'identity', 'relationship', 'goal', 'project', 'event', 'constraint');--> statement-breakpoint
CREATE TYPE "public"."memory_status" AS ENUM('active', 'superseded', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."memory_relation_type" AS ENUM('semantic', 'temporal', 'preference', 'identity', 'project', 'relationship', 'contradiction', 'supersedes', 'derived');--> statement-breakpoint
CREATE TABLE "artifacts" (
  "id" varchar(26) PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "type" "artifact_type" DEFAULT 'note' NOT NULL,
  "raw_content" text NOT NULL,
  "source" varchar(100) NOT NULL,
  "source_ref" text,
  "metadata" jsonb,
  "embedding" vector(768),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_records" (
  "id" varchar(26) PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "tier" "memory_tier" DEFAULT 'long_term' NOT NULL,
  "kind" "memory_kind" NOT NULL,
  "canonical_text" text NOT NULL,
  "summary" text,
  "json_payload" jsonb,
  "salience" real DEFAULT 0.5 NOT NULL,
  "confidence" real DEFAULT 0.5 NOT NULL,
  "status" "memory_status" DEFAULT 'active' NOT NULL,
  "dedupe_key" varchar(255),
  "first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_accessed_at" timestamp with time zone,
  "reinforcement_count" integer DEFAULT 1 NOT NULL,
  "embedding" vector(768),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_evidence" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "memory_id" varchar(26) NOT NULL,
  "artifact_id" varchar(26),
  "message_id" uuid,
  "evidence_text" text NOT NULL,
  "confidence" real DEFAULT 0.5 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_edges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "source_memory_id" varchar(26) NOT NULL,
  "target_memory_id" varchar(26) NOT NULL,
  "relation_type" "memory_relation_type" NOT NULL,
  "weight" real DEFAULT 1,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_state" (
  "conversation_id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "summary" text,
  "active_topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "open_loops" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "recent_preferences" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "last_user_goal" text,
  "last_updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_records" ADD CONSTRAINT "memory_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_evidence" ADD CONSTRAINT "memory_evidence_memory_id_memory_records_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memory_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_evidence" ADD CONSTRAINT "memory_evidence_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_evidence" ADD CONSTRAINT "memory_evidence_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_edges" ADD CONSTRAINT "memory_edges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_edges" ADD CONSTRAINT "memory_edges_source_memory_id_memory_records_id_fk" FOREIGN KEY ("source_memory_id") REFERENCES "public"."memory_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_edges" ADD CONSTRAINT "memory_edges_target_memory_id_memory_records_id_fk" FOREIGN KEY ("target_memory_id") REFERENCES "public"."memory_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_state" ADD CONSTRAINT "conversation_state_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_state" ADD CONSTRAINT "conversation_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "artifacts_user_id_idx" ON "artifacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "artifacts_type_idx" ON "artifacts" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "artifacts_created_at_idx" ON "artifacts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "memory_records_user_tier_idx" ON "memory_records" USING btree ("user_id","tier");--> statement-breakpoint
CREATE INDEX "memory_records_user_kind_idx" ON "memory_records" USING btree ("user_id","kind");--> statement-breakpoint
CREATE INDEX "memory_records_status_idx" ON "memory_records" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "memory_records_dedupe_idx" ON "memory_records" USING btree ("user_id","dedupe_key");--> statement-breakpoint
CREATE INDEX "memory_records_last_seen_idx" ON "memory_records" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "memory_evidence_memory_idx" ON "memory_evidence" USING btree ("memory_id");--> statement-breakpoint
CREATE INDEX "memory_evidence_artifact_idx" ON "memory_evidence" USING btree ("artifact_id");--> statement-breakpoint
CREATE INDEX "memory_evidence_message_idx" ON "memory_evidence" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "memory_edges_source_idx" ON "memory_edges" USING btree ("source_memory_id");--> statement-breakpoint
CREATE INDEX "memory_edges_target_idx" ON "memory_edges" USING btree ("target_memory_id");--> statement-breakpoint
CREATE INDEX "memory_edges_user_type_idx" ON "memory_edges" USING btree ("user_id","relation_type");--> statement-breakpoint
CREATE UNIQUE INDEX "memory_edges_unique_idx" ON "memory_edges" USING btree ("source_memory_id","target_memory_id","relation_type");--> statement-breakpoint
CREATE INDEX "conversation_state_user_idx" ON "conversation_state" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "memory_records_embedding_idx" ON "memory_records" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "memory_records_fts_idx" ON "memory_records" USING gin (to_tsvector('english', coalesce("canonical_text", '') || ' ' || coalesce("summary", '')));

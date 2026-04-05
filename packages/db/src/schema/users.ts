import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  hashedPassword: text("hashed_password"),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  socialLinks: jsonb("social_links").$type<{
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
  }>(),
  resumeNodeId: varchar("resume_node_id", { length: 26 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

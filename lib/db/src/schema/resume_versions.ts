import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { resumesTable } from "./resumes";

export const resumeVersionsTable = pgTable("resume_versions", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id")
    .notNull()
    .references(() => resumesTable.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull().default(1),
  content: text("content").notNull(),
  score: real("score"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertResumeVersionSchema = createInsertSchema(
  resumeVersionsTable
).omit({ id: true, createdAt: true });
export type InsertResumeVersion = z.infer<typeof insertResumeVersionSchema>;
export type ResumeVersion = typeof resumeVersionsTable.$inferSelect;

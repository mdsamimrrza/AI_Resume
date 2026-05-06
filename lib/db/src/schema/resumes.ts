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

export const resumesTable = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  rawText: text("raw_text").notNull(),
  fileUrl: text("file_url"),
  iteration: integer("iteration").notNull().default(1),
  pipelineStage: text("pipeline_stage").notNull().default("pending"),
  matchScore: real("match_score"),
  jobDescription: text("job_description"),
  jobTitle: text("job_title"),
  company: text("company"),
  portfolioUrl: text("portfolio_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertResumeSchema = createInsertSchema(resumesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumesTable.$inferSelect;

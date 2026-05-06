import {
  pgTable,
  text,
  serial,
  integer,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { resumesTable } from "./resumes";

export const extractedSkillsTable = pgTable("extracted_skills", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id")
    .notNull()
    .references(() => resumesTable.id, { onDelete: "cascade" }),
  skillName: text("skill_name").notNull(),
  category: text("category").notNull(),
  confidenceScore: real("confidence_score").notNull().default(0.8),
});

export const insertExtractedSkillSchema = createInsertSchema(
  extractedSkillsTable
).omit({ id: true });
export type InsertExtractedSkill = z.infer<typeof insertExtractedSkillSchema>;
export type ExtractedSkill = typeof extractedSkillsTable.$inferSelect;

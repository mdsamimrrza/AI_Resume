import { pgTable, serial, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { resumesTable } from "./resumes";

export const validationsTable = pgTable("validations", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id")
    .notNull()
    .references(() => resumesTable.id, { onDelete: "cascade" }),
  atsScore: real("ats_score").notNull().default(0),
  keywordScore: real("keyword_score").notNull().default(0),
  formattingScore: real("formatting_score").notNull().default(0),
  skillMatchScore: real("skill_match_score").notNull().default(0),
  checklistResults: jsonb("checklist_results"),
});

export const insertValidationSchema = createInsertSchema(validationsTable).omit(
  { id: true }
);
export type InsertValidation = z.infer<typeof insertValidationSchema>;
export type Validation = typeof validationsTable.$inferSelect;

import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { resumesTable } from "./resumes";

export const skillGapsTable = pgTable("skill_gaps", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id")
    .notNull()
    .references(() => resumesTable.id, { onDelete: "cascade" }),
  missingSkill: text("missing_skill").notNull(),
  importanceLevel: text("importance_level").notNull().default("moderate"),
  suggestion: text("suggestion"),
});

export const insertSkillGapSchema = createInsertSchema(skillGapsTable).omit({
  id: true,
});
export type InsertSkillGap = z.infer<typeof insertSkillGapSchema>;
export type SkillGap = typeof skillGapsTable.$inferSelect;

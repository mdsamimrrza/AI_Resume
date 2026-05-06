import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobDescriptionsTable = pgTable("job_descriptions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  rawText: text("raw_text").notNull(),
  requiredSkills: jsonb("required_skills"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertJobDescriptionSchema = createInsertSchema(
  jobDescriptionsTable
).omit({ id: true, createdAt: true });
export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;
export type JobDescription = typeof jobDescriptionsTable.$inferSelect;

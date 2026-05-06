import mongoose from "mongoose";
import { z } from "zod";

const skillGapSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true },
  missingSkill: { type: String, required: true },
  importanceLevel: { type: String, default: "moderate" },
  suggestion: String,
});

export const SkillGapModel = mongoose.model("SkillGap", skillGapSchema);
export const skillGapsTable = SkillGapModel;

export const insertSkillGapSchema = z.object({
  resumeId: z.string(),
  missingSkill: z.string(),
  importanceLevel: z.string().optional(),
  suggestion: z.string().optional(),
});

export type InsertSkillGap = z.infer<typeof insertSkillGapSchema>;
export type SkillGap = mongoose.InferSchemaType<typeof skillGapSchema> & { _id: mongoose.Types.ObjectId };

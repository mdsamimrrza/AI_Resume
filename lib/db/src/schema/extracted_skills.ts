import mongoose from "mongoose";
import { z } from "zod";

const extractedSkillSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true },
  skillName: { type: String, required: true },
  category: { type: String, required: true },
  confidenceScore: { type: Number, default: 0.8 },
});

export const ExtractedSkillModel = mongoose.model("ExtractedSkill", extractedSkillSchema);
export const extractedSkillsTable = ExtractedSkillModel;

export const insertExtractedSkillSchema = z.object({
  resumeId: z.string(),
  skillName: z.string(),
  category: z.string(),
  confidenceScore: z.number().optional(),
});

export type InsertExtractedSkill = z.infer<typeof insertExtractedSkillSchema>;
export type ExtractedSkill = mongoose.InferSchemaType<typeof extractedSkillSchema> & { _id: mongoose.Types.ObjectId };

import mongoose from "mongoose";
import { z } from "zod";

const validationSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true },
  atsScore: { type: Number, default: 0 },
  keywordScore: { type: Number, default: 0 },
  formattingScore: { type: Number, default: 0 },
  skillMatchScore: { type: Number, default: 0 },
  checklistResults: mongoose.Schema.Types.Mixed,
});

export const ValidationModel = mongoose.model("Validation", validationSchema);
export const validationsTable = ValidationModel;

export const insertValidationSchema = z.object({
  resumeId: z.string(),
  atsScore: z.number().optional(),
  keywordScore: z.number().optional(),
  formattingScore: z.number().optional(),
  skillMatchScore: z.number().optional(),
  checklistResults: z.any().optional(),
});

export type InsertValidation = z.infer<typeof insertValidationSchema>;
export type Validation = mongoose.InferSchemaType<typeof validationSchema> & { _id: mongoose.Types.ObjectId };

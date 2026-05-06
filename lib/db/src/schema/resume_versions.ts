import mongoose from "mongoose";
import { z } from "zod";

const resumeVersionSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true },
  versionNumber: { type: Number, default: 1 },
  content: { type: String, required: true },
  score: Number,
  createdAt: { type: Date, default: Date.now },
});

export const ResumeVersionModel = mongoose.model("ResumeVersion", resumeVersionSchema);
export const resumeVersionsTable = ResumeVersionModel;

export const insertResumeVersionSchema = z.object({
  resumeId: z.string(),
  versionNumber: z.number().optional(),
  content: z.string(),
  score: z.number().optional(),
});

export type InsertResumeVersion = z.infer<typeof insertResumeVersionSchema>;
export type ResumeVersion = mongoose.InferSchemaType<typeof resumeVersionSchema> & { _id: mongoose.Types.ObjectId };

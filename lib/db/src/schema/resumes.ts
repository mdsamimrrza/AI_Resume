import mongoose from "mongoose";
import { z } from "zod";

const resumeSchema = new mongoose.Schema({
  userId: String,
  rawText: { type: String, required: true },
  fileUrl: String,
  iteration: { type: Number, default: 1 },
  pipelineStage: { type: String, default: "pending" },
  matchScore: Number,
  jobDescription: String,
  jobTitle: String,
  company: String,
  portfolioUrl: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

resumeSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

export const ResumeModel = mongoose.model("Resume", resumeSchema);
export const resumesTable = ResumeModel; // Keep alias for easier refactoring

export const insertResumeSchema = z.object({
  userId: z.string().optional(),
  rawText: z.string(),
  fileUrl: z.string().optional(),
  iteration: z.number().optional(),
  pipelineStage: z.string().optional(),
  matchScore: z.number().optional(),
  jobDescription: z.string().optional(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  portfolioUrl: z.string().optional(),
});

export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = mongoose.InferSchemaType<typeof resumeSchema> & { _id: mongoose.Types.ObjectId };

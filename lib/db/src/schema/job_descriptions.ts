import mongoose from "mongoose";
import { z } from "zod";

const jobDescriptionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  rawText: { type: String, required: true },
  requiredSkills: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

export const JobDescriptionModel = mongoose.model("JobDescription", jobDescriptionSchema);
export const jobDescriptionsTable = JobDescriptionModel;

export const insertJobDescriptionSchema = z.object({
  title: z.string(),
  company: z.string(),
  rawText: z.string(),
  requiredSkills: z.any().optional(),
});

export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;
export type JobDescription = mongoose.InferSchemaType<typeof jobDescriptionSchema> & { _id: mongoose.Types.ObjectId };

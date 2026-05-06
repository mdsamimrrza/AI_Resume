import mongoose from "mongoose";
import { z } from "zod";

const conversationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const ConversationModel = mongoose.model("Conversation", conversationSchema);
export const conversationsTable = ConversationModel;
export const conversations = ConversationModel; // Add another alias for consistency

export const insertConversationSchema = z.object({
  title: z.string(),
});

export type Conversation = mongoose.InferSchemaType<typeof conversationSchema> & { _id: mongoose.Types.ObjectId };
export type InsertConversation = z.infer<typeof insertConversationSchema>;

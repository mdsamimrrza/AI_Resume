import mongoose from "mongoose";
import { z } from "zod";

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const MessageModel = mongoose.model("Message", messageSchema);
export const messages = MessageModel;

export const insertMessageSchema = z.object({
  conversationId: z.string(),
  role: z.string(),
  content: z.string(),
});

export type Message = mongoose.InferSchemaType<typeof messageSchema> & { _id: mongoose.Types.ObjectId };
export type InsertMessage = z.infer<typeof insertMessageSchema>;

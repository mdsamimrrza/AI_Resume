import OpenAI from "openai";

const hasReplitProxy =
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL &&
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

const hasDirectKey = !!process.env.OPENAI_API_KEY;

if (!hasReplitProxy && !hasDirectKey) {
  throw new Error(
    "No OpenAI credentials found. Set OPENAI_API_KEY or provision the Replit OpenAI AI integration.",
  );
}

export const openai = new OpenAI(
  hasReplitProxy
    ? {
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      }
    : {
        apiKey: process.env.OPENAI_API_KEY,
      },
);

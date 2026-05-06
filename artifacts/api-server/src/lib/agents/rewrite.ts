import { openai } from "@workspace/integrations-openai-ai-server";
import type { SuggestionResult } from "./suggestion";

export async function rewriteAgent(
  originalText: string,
  suggestions: SuggestionResult[]
): Promise<string> {
  const suggestionText = suggestions
    .map(
      (s) =>
        `For "${s.missingSkill}" (${s.importanceLevel}):\n${s.bullets.map((b) => `- ${b}`).join("\n")}`
    )
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content: `You are an expert resume writer. Rewrite and enhance the provided resume by incorporating the given suggestions.

Rules:
- Preserve the original structure, format, and tone of the resume
- Naturally weave in the suggested skills and improvements
- Enhance existing bullet points with stronger action verbs and metrics where possible
- Add suggested skills to the appropriate sections
- Do NOT fabricate experiences or achievements — only enhance what's there
- Keep the rewritten resume roughly the same length
- Return ONLY the rewritten resume text, no preamble or explanation`,
      },
      {
        role: "user",
        content: `Original Resume:
${originalText}

Suggestions to incorporate:
${suggestionText}

Rewrite the resume incorporating these suggestions.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from rewrite agent");
  return content;
}

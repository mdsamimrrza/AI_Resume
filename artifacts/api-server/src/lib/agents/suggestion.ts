import { openai } from "@workspace/integrations-openai-ai-server";
import type { GapResult } from "./gap_analysis";

export interface SuggestionResult {
  gapId: number;
  missingSkill: string;
  importanceLevel: string;
  bullets: string[];
}

export async function suggestionAgent(
  gaps: Array<GapResult & { id: number }>,
  resumeText: string
): Promise<SuggestionResult[]> {
  if (gaps.length === 0) return [];

  const gapList = gaps
    .map(
      (g, i) =>
        `${i + 1}. ${g.missingSkill} (${g.importanceLevel}): ${g.suggestion}`
    )
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content: `You are an expert resume writer and career coach. Generate specific, actionable resume improvement suggestions.
Return a valid JSON object:
{
  "suggestions": [
    {
      "missingSkill": "string",
      "bullets": ["specific suggestion 1", "specific suggestion 2", "specific suggestion 3"]
    }
  ]
}

For each gap, provide 3-5 bullets that are:
- Specific (not generic advice)
- Actionable (exactly what to add or change)
- Phrased as resume-ready content where possible
- Contextually relevant to what's already in their resume
- Include WHERE in the resume to place it (skills section, bullet under job X, etc.)`,
      },
      {
        role: "user",
        content: `Resume excerpt:
${resumeText.slice(0, 2000)}

Skill gaps to address:
${gapList}

Generate specific suggestions for each gap.`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from suggestion agent");

  const parsed = JSON.parse(content) as {
    suggestions: Array<{ missingSkill: string; bullets: string[] }>;
  };

  return parsed.suggestions.map((s, i) => ({
    gapId: gaps[i]?.id ?? i,
    missingSkill: s.missingSkill,
    importanceLevel: gaps[i]?.importanceLevel ?? "moderate",
    bullets: s.bullets,
  }));
}

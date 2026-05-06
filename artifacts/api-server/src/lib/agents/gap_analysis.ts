import { openai } from "@workspace/integrations-openai-ai-server";
import type { ExtractedData } from "./extraction";

export interface GapResult {
  missingSkill: string;
  importanceLevel: "critical" | "moderate" | "nice-to-have";
  suggestion: string;
}

export async function gapAnalysisAgent(
  extracted: ExtractedData,
  jobDescription: string
): Promise<GapResult[]> {
  const skillList = extracted.skills
    .map((s) => `${s.skillName} (${s.category})`)
    .join(", ");

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `You are an expert career coach and ATS specialist. Analyze skill gaps between a candidate's resume and a job description.
Return a valid JSON array of gap objects:
[{"missingSkill": "string", "importanceLevel": "critical|moderate|nice-to-have", "suggestion": "brief actionable suggestion"}]

importanceLevel guidelines:
- critical: explicitly required, appears multiple times, or is a core technical requirement
- moderate: mentioned as preferred or required with alternatives
- nice-to-have: listed as a bonus or appears in lower-priority sections

Identify ONLY genuinely missing skills — do not flag skills the candidate clearly has.
Focus on skills that would meaningfully improve ATS scoring and interview chances.
Return empty array [] if no significant gaps exist.`,
      },
      {
        role: "user",
        content: `Candidate skills: ${skillList}
Experience: ${extracted.experienceYears} years
Job titles: ${extracted.jobTitles.join(", ")}

Job Description:
${jobDescription}

Identify the most important skill gaps.`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from gap analysis agent");

  const parsed = JSON.parse(content) as { gaps?: GapResult[] } | GapResult[];
  const gaps = Array.isArray(parsed) ? parsed : (parsed.gaps ?? []);
  return gaps;
}

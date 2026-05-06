import { openai } from "@workspace/integrations-openai-ai-server";

export interface ValidationOutput {
  atsScore: number;
  keywordScore: number;
  formattingScore: number;
  skillMatchScore: number;
  checklist: Array<{ item: string; passed: boolean; detail: string | null }>;
}

export async function validationAgent(
  rewrittenText: string,
  jobDescription: string
): Promise<ValidationOutput> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `You are an ATS (Applicant Tracking System) expert. Score a resume against a job description.

Return a valid JSON object:
{
  "keywordScore": 0-100,
  "formattingScore": 0-100,
  "skillMatchScore": 0-100,
  "checklist": [
    {"item": "string", "passed": true|false, "detail": "string or null"}
  ]
}

Scoring weights: keyword density 30%, formatting 20%, skill match 50%

keywordScore (0-100): How well does the resume include keywords from the job description?
formattingScore (0-100): Resume structure, bullet points, action verbs, length, sections
skillMatchScore (0-100): How well do the candidate's skills match the required skills?

Checklist items to include:
- Strong action verbs used
- Quantified achievements present
- Required technical skills mentioned
- Education requirements met
- Appropriate resume length (1-2 pages)
- Contact information present
- Professional summary included
- Keywords from job description included
- No spelling/grammar issues (assess from text)
- Skills section well-organized`,
      },
      {
        role: "user",
        content: `Resume:
${rewrittenText}

Job Description:
${jobDescription}

Score this resume and provide ATS analysis.`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from validation agent");

  const parsed = JSON.parse(content) as Omit<ValidationOutput, "atsScore">;
  const atsScore = Math.round(
    parsed.keywordScore * 0.3 +
      parsed.formattingScore * 0.2 +
      parsed.skillMatchScore * 0.5
  );

  return { ...parsed, atsScore };
}

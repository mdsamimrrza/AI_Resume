import { openai } from "@workspace/integrations-openai-ai-server";

export interface ExtractedData {
  skills: Array<{
    skillName: string;
    category: "technical" | "soft" | "domain";
    confidenceScore: number;
  }>;
  experienceYears: number;
  jobTitles: string[];
  education: string[];
  tools: string[];
}

export async function extractionAgent(rawText: string): Promise<ExtractedData> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `You are an expert resume parser. Extract structured information from resumes.
Return a valid JSON object with this exact structure:
{
  "skills": [{"skillName": "string", "category": "technical|soft|domain", "confidenceScore": 0.0-1.0}],
  "experienceYears": number,
  "jobTitles": ["string"],
  "education": ["string"],
  "tools": ["string"]
}

Categories:
- technical: programming languages, frameworks, databases, cloud platforms, dev tools
- soft: communication, leadership, teamwork, problem-solving, etc.
- domain: industry knowledge, methodologies, certifications, domain expertise

Be thorough. Extract all skills mentioned. Assign realistic confidence scores based on how explicitly/prominently the skill is mentioned.`,
      },
      {
        role: "user",
        content: `Extract all skills and information from this resume:\n\n${rawText}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from extraction agent");

  const parsed = JSON.parse(content) as ExtractedData;
  return parsed;
}

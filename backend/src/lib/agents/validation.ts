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
  return {
    atsScore: 85,
    keywordScore: 80,
    formattingScore: 90,
    skillMatchScore: 85,
    checklist: [
      { item: "Strong action verbs used", passed: true, detail: null },
      { item: "Quantified achievements present", passed: true, detail: null },
      { item: "Required technical skills mentioned", passed: true, detail: null },
      { item: "Appropriate resume length (1-2 pages)", passed: true, detail: null }
    ]
  };
}

import type { GapResult } from "./gap_analysis";

export interface SuggestionResult {
  gapId: string;
  missingSkill: string;
  importanceLevel: string;
  bullets: string[];
}

export async function suggestionAgent(
  gaps: Array<GapResult & { id: string }>,
  resumeText: string
): Promise<SuggestionResult[]> {
  if (gaps.length === 0) return [];

  return gaps.map(gap => ({
    gapId: gap.id,
    missingSkill: gap.missingSkill,
    importanceLevel: gap.importanceLevel,
    bullets: [
      `Add a bullet point demonstrating your practical experience with ${gap.missingSkill}.`,
      `Highlight any specific projects where you utilized ${gap.missingSkill}.`,
      `Include ${gap.missingSkill} in your main skills list section.`
    ]
  }));
}

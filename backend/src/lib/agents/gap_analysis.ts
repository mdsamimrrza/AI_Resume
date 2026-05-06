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
  const gaps: GapResult[] = [];
  const jd = jobDescription.toLowerCase();
  
  const extractedSkillNames = extracted.skills.map(s => s.skillName.toLowerCase());
  
  if (jd.includes("docker") && !extractedSkillNames.includes("docker")) {
    gaps.push({ missingSkill: "Docker", importanceLevel: "critical", suggestion: "Add Docker to your skills" });
  }
  
  if (jd.includes("aws") && !extractedSkillNames.includes("aws")) {
    gaps.push({ missingSkill: "AWS", importanceLevel: "moderate", suggestion: "Mention AWS experience" });
  }

  if (gaps.length === 0) {
    gaps.push({ missingSkill: "Cloud Deployment", importanceLevel: "nice-to-have", suggestion: "Include cloud deployment experience if any" });
  }
  
  return gaps;
}

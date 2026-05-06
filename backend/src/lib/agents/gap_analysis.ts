import type { ExtractedData } from "./extraction.js";

export interface GapResult {
  missingSkill: string;
  importanceLevel: "critical" | "moderate" | "nice-to-have";
  suggestion: string;
}

const ALL_SKILLS = [
  "React", "Node.js", "TypeScript", "JavaScript", "Python", "Java", "C++", "C#", "Docker", "AWS", "Azure", "GCP",
  "SQL", "NoSQL", "MongoDB", "PostgreSQL", "React Native", "Flutter", "Swift", "Kotlin", "Go", "Rust", "PHP", "Ruby",
  "Tailwind", "CSS", "HTML", "Redux", "GraphQL", "REST", "API", "Kubernetes", "CI/CD", "Git", "GitHub", "Jenkins",
  "Terraform", "Next.js", "Angular", "Vue", "Express", "Spring", "Django", "Flask", "Laravel", "Rails",
  "Communication", "Leadership", "Teamwork", "Problem Solving", "Time Management", "Adaptability", "Agile", "Scrum"
];

export async function gapAnalysisAgent(
  extracted: ExtractedData,
  jobDescription: string
): Promise<GapResult[]> {
  const gaps: GapResult[] = [];
  const jd = jobDescription.toLowerCase();
  const extractedNames = new Set(extracted.skills.map(s => s.skillName.toLowerCase()));
  
  ALL_SKILLS.forEach(skill => {
    const sLow = skill.toLowerCase();
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").toLowerCase();
    const pattern = new RegExp(`\\b${escaped}(\\.?js)?\\b|\\b${escaped}\\b`, "i");

    // If the skill is in the JD but NOT in the resume
    if (pattern.test(jd) && !extractedNames.has(sLow)) {
      gaps.push({
        missingSkill: skill,
        importanceLevel: "moderate",
        suggestion: `The job description emphasizes ${skill}. Consider adding projects or certifications that demonstrate your proficiency in this area.`
      });
    }
  });

  return gaps;
}

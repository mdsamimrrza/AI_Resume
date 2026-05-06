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
  // Deterministic mock logic
  const text = rawText.toLowerCase();
  const skills = [];
  
  if (text.includes("react")) skills.push({ skillName: "React", category: "technical" as const, confidenceScore: 0.9 });
  if (text.includes("node") || text.includes("node.js")) skills.push({ skillName: "Node.js", category: "technical" as const, confidenceScore: 0.9 });
  if (text.includes("typescript")) skills.push({ skillName: "TypeScript", category: "technical" as const, confidenceScore: 0.85 });
  if (text.includes("management")) skills.push({ skillName: "Project Management", category: "domain" as const, confidenceScore: 0.8 });
  
  if (skills.length === 0) {
    skills.push({ skillName: "JavaScript", category: "technical" as const, confidenceScore: 0.9 });
    skills.push({ skillName: "Communication", category: "soft" as const, confidenceScore: 0.8 });
  }

  return {
    skills,
    experienceYears: 3,
    jobTitles: ["Software Engineer"],
    education: ["B.S. Computer Science"],
    tools: skills.filter(s => s.category === "technical").map(s => s.skillName)
  };
}

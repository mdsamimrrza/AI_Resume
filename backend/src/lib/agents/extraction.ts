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

const SKILL_DICTIONARY = {
  technical: [
    "React", "Node.js", "TypeScript", "JavaScript", "Python", "Java", "C++", "C#", "Docker", "AWS", "Azure", "GCP",
    "SQL", "NoSQL", "MongoDB", "PostgreSQL", "React Native", "Flutter", "Swift", "Kotlin", "Go", "Rust", "PHP", "Ruby",
    "Tailwind", "CSS", "HTML", "Redux", "GraphQL", "REST", "API", "Kubernetes", "CI/CD", "Git", "GitHub", "Jenkins",
    "Terraform", "Next.js", "Angular", "Vue", "Express", "Spring", "Django", "Flask", "Laravel", "Rails"
  ],
  soft: [
    "Communication", "Leadership", "Teamwork", "Problem Solving", "Time Management", "Adaptability",
    "Critical Thinking", "Conflict Resolution", "Creativity", "Emotional Intelligence", "Agile", "Scrum"
  ],
  domain: [
    "Project Management", "Product Management", "Marketing", "Sales", "Finance", "Healthcare", "E-commerce", "Fintech"
  ]
};

export async function extractionAgent(rawText: string): Promise<ExtractedData> {
  const text = rawText.toLowerCase();
  const skills: ExtractedData["skills"] = [];
  
  // Extract technical skills with more flexible matching
  SKILL_DICTIONARY.technical.forEach(skill => {
    // Escape special characters for regex (like C++)
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escaped.toLowerCase()}(\\.?js)?\\b|\\b${escaped.toLowerCase()}\\b`, "i");
    if (pattern.test(text)) {
      skills.push({ skillName: skill, category: "technical", confidenceScore: 1.0 });
    }
  });

  // Extract soft skills
  SKILL_DICTIONARY.soft.forEach(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped.toLowerCase()}\\b`, "i").test(text)) {
      skills.push({ skillName: skill, category: "soft", confidenceScore: 1.0 });
    }
  });

  // Extract domain skills
  SKILL_DICTIONARY.domain.forEach(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped.toLowerCase()}\\b`, "i").test(text)) {
      skills.push({ skillName: skill, category: "domain", confidenceScore: 1.0 });
    }
  });

  // Basic regex for experience
  const expMatch = text.match(/(\d+)\+?\s*years?/);
  const years = expMatch ? parseInt(expMatch[1]) : 0;

  // Simple title detection (looking for common titles)
  const titles = ["software engineer", "developer", "manager", "architect", "lead", "designer", "analyst"];
  const foundTitles = titles.filter(t => text.includes(t));

  return {
    skills,
    experienceYears: years,
    jobTitles: foundTitles.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
    education: [],
    tools: skills.filter(s => s.category === "technical").map(s => s.skillName)
  };
}

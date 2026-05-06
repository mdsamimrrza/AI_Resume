export async function rewriteAgent(
  resumeText: string,
  suggestions: any[]
): Promise<string> {
  // Strip any legacy optimization notices if they exist
  let rewritten = resumeText.replace(/\[OPTIMIZATION NOTICE:[\s\S]*?\]\n*/g, "");
  
  if (suggestions.length > 0) {
    const missing = suggestions.map(s => s.missingSkill);
    
    // Try to find a "Skills" or "Technical Skills" section and inject
    const skillsSectionPattern = /(skills|technical skills|competencies|technologies)[:\s]*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i;
    const match = resumeText.match(skillsSectionPattern);

    if (match) {
      const header = match[1];
      const existingSkills = match[2];
      const newSkills = missing.join(", ");
      
      const updatedSection = `${header}: ${existingSkills.trim()}, ${newSkills}`;
      rewritten = resumeText.replace(match[0], updatedSection);
    } else {
      // No skills section found, just return original to avoid ugly headers
      rewritten = resumeText;
    }
  }

  return rewritten;
}

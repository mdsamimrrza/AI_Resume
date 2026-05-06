import type { SuggestionResult } from "./suggestion";

export async function rewriteAgent(
  originalText: string,
  suggestions: SuggestionResult[]
): Promise<string> {
  let rewritten = originalText;
  
  if (suggestions.length > 0) {
    const addedSkills = suggestions.map(s => s.missingSkill).join(", ");
    rewritten += `\n\n--- Enhanced Skills Section ---\nAdded: ${addedSkills}\n`;
    
    suggestions.forEach(s => {
      rewritten += `\n* Integrated ${s.missingSkill} experience to match job requirements.`;
    });
  }
  
  return rewritten;
}

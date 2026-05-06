import { db } from "@workspace/db";
import {
  resumesTable,
  resumeVersionsTable,
  extractedSkillsTable,
  skillGapsTable,
  validationsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { extractionAgent } from "./agents/extraction";
import { gapAnalysisAgent } from "./agents/gap_analysis";
import { suggestionAgent } from "./agents/suggestion";
import { rewriteAgent } from "./agents/rewrite";
import { validationAgent } from "./agents/validation";
import { logger } from "./logger";

async function updateStage(resumeId: number, stage: string) {
  await db
    .update(resumesTable)
    .set({ pipelineStage: stage })
    .where(eq(resumesTable.id, resumeId));
}

export async function runPipeline(resumeId: number): Promise<void> {
  try {
    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.id, resumeId));

    if (!resume) {
      logger.error({ resumeId }, "Resume not found for pipeline");
      return;
    }

    const rawText = resume.rawText;
    const jobDescription = resume.jobDescription ?? "";

    // Stage 1: Extract
    await updateStage(resumeId, "extracting");
    logger.info({ resumeId }, "Starting extraction agent");
    const extracted = await extractionAgent(rawText);

    // Clear old extracted skills and save new ones
    await db
      .delete(extractedSkillsTable)
      .where(eq(extractedSkillsTable.resumeId, resumeId));
    if (extracted.skills.length > 0) {
      await db.insert(extractedSkillsTable).values(
        extracted.skills.map((s) => ({
          resumeId,
          skillName: s.skillName,
          category: s.category,
          confidenceScore: s.confidenceScore,
        }))
      );
    }

    // Stage 2: Gap Analysis
    await updateStage(resumeId, "analyzing_gaps");
    logger.info({ resumeId }, "Starting gap analysis agent");
    const gaps = await gapAnalysisAgent(extracted, jobDescription);

    await db.delete(skillGapsTable).where(eq(skillGapsTable.resumeId, resumeId));
    let savedGaps: Array<{ id: number; missingSkill: string; importanceLevel: string }> = [];
    if (gaps.length > 0) {
      savedGaps = await db
        .insert(skillGapsTable)
        .values(
          gaps.map((g) => ({
            resumeId,
            missingSkill: g.missingSkill,
            importanceLevel: g.importanceLevel,
            suggestion: g.suggestion,
          }))
        )
        .returning({ id: skillGapsTable.id, missingSkill: skillGapsTable.missingSkill, importanceLevel: skillGapsTable.importanceLevel });
    }

    // Stage 3: Suggestions
    await updateStage(resumeId, "generating_suggestions");
    logger.info({ resumeId }, "Starting suggestion agent");
    const suggestions = await suggestionAgent(
      savedGaps.map((g) => ({
        id: g.id,
        missingSkill: g.missingSkill,
        importanceLevel: g.importanceLevel as "critical" | "moderate" | "nice-to-have",
        suggestion: "",
      })),
      rawText
    );

    // Update gaps with suggestion text
    for (const sugg of suggestions) {
      await db
        .update(skillGapsTable)
        .set({ suggestion: sugg.bullets.join(" | ") })
        .where(eq(skillGapsTable.id, sugg.gapId));
    }

    // Stage 4: Rewrite
    await updateStage(resumeId, "rewriting");
    logger.info({ resumeId }, "Starting rewrite agent");
    const rewrittenText = await rewriteAgent(rawText, suggestions);

    // Get current version number
    const existingVersions = await db
      .select()
      .from(resumeVersionsTable)
      .where(eq(resumeVersionsTable.resumeId, resumeId));
    const nextVersion = existingVersions.length + 1;

    // Stage 5: Validation
    await updateStage(resumeId, "validating");
    logger.info({ resumeId }, "Starting validation agent");
    const validation = await validationAgent(rewrittenText, jobDescription);

    // Save version with score
    await db.insert(resumeVersionsTable).values({
      resumeId,
      versionNumber: nextVersion,
      content: rewrittenText,
      score: validation.atsScore,
    });

    // Save validation
    await db.delete(validationsTable).where(eq(validationsTable.resumeId, resumeId));
    await db.insert(validationsTable).values({
      resumeId,
      atsScore: validation.atsScore,
      keywordScore: validation.keywordScore,
      formattingScore: validation.formattingScore,
      skillMatchScore: validation.skillMatchScore,
      checklistResults: validation.checklist,
    });

    // Calculate match score
    const matchScore = Math.round(
      validation.skillMatchScore * 0.6 + validation.keywordScore * 0.4
    );

    await db
      .update(resumesTable)
      .set({ pipelineStage: "complete", matchScore })
      .where(eq(resumesTable.id, resumeId));

    logger.info({ resumeId, atsScore: validation.atsScore, matchScore }, "Pipeline complete");
  } catch (err) {
    logger.error({ resumeId, err }, "Pipeline failed");
    await updateStage(resumeId, "error");
  }
}

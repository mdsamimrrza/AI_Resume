import {
  resumesTable as ResumeModel,
  resumeVersionsTable as ResumeVersionModel,
  extractedSkillsTable as ExtractedSkillModel,
  skillGapsTable as SkillGapModel,
  validationsTable as ValidationModel,
} from "@workspace/db";
import { extractionAgent } from "./agents/extraction.js";
import { gapAnalysisAgent } from "./agents/gap_analysis.js";
import { suggestionAgent } from "./agents/suggestion.js";
import { rewriteAgent } from "./agents/rewrite.js";
import { validationAgent } from "./agents/validation.js";
import { logger } from "./logger.js";

async function updateStage(resumeId: string, stage: string) {
  await ResumeModel.findByIdAndUpdate(resumeId, { pipelineStage: stage });
}

export async function runPipeline(resumeId: string): Promise<void> {
  try {
    const resume = await ResumeModel.findById(resumeId);

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
    await ExtractedSkillModel.deleteMany({ resumeId });
    if (extracted.skills.length > 0) {
      await ExtractedSkillModel.insertMany(
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

    await SkillGapModel.deleteMany({ resumeId });
    let savedGaps: Array<{ id: string; missingSkill: string; importanceLevel: string }> = [];
    if (gaps.length > 0) {
      const createdGaps = await SkillGapModel.insertMany(
        gaps.map((g) => ({
          resumeId,
          missingSkill: g.missingSkill,
          importanceLevel: g.importanceLevel,
          suggestion: g.suggestion,
        }))
      );
      savedGaps = createdGaps.map(g => ({
        id: g._id.toString(),
        missingSkill: g.missingSkill,
        importanceLevel: g.importanceLevel || "moderate"
      }));
    }

    // Stage 3: Suggestions
    await updateStage(resumeId, "generating_suggestions");
    logger.info({ resumeId }, "Starting suggestion agent");
    const suggestions = await suggestionAgent(
      savedGaps.map((g) => ({
        id: g.id,
        gapId: g.id,
        missingSkill: g.missingSkill,
        importanceLevel: g.importanceLevel as "critical" | "moderate" | "nice-to-have",
        bullets: [],
        applied: false
      })),
      rawText
    );

    // Update gaps with suggestion text
    for (const sugg of suggestions) {
      await SkillGapModel.findByIdAndUpdate(sugg.gapId, {
        suggestion: sugg.bullets.join(" | ")
      });
    }

    // Stage 4: Rewrite
    await updateStage(resumeId, "rewriting");
    logger.info({ resumeId }, "Starting rewrite agent");
    const rewrittenText = await rewriteAgent(rawText, suggestions);

    // Get current version number
    const versionCount = await ResumeVersionModel.countDocuments({ resumeId });
    const nextVersion = versionCount + 1;

    // Stage 5: Validation
    await updateStage(resumeId, "validating");
    logger.info({ resumeId }, "Starting validation agent");
    const validation = await validationAgent(rewrittenText, jobDescription);

    // Save version with score
    await ResumeVersionModel.create({
      resumeId,
      versionNumber: nextVersion,
      content: rewrittenText,
      score: validation.atsScore,
    });

    // Save validation
    await ValidationModel.deleteMany({ resumeId });
    await ValidationModel.create({
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

    await ResumeModel.findByIdAndUpdate(resumeId, {
      pipelineStage: "complete",
      matchScore
    });

    logger.info({ resumeId, atsScore: validation.atsScore, matchScore }, "Pipeline complete");
  } catch (err) {
    logger.error({ resumeId, err }, "Pipeline failed");
    await updateStage(resumeId, "error");
  }
}

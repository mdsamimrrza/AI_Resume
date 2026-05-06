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

export async function runPipeline(resumeId: string, stopAtStage?: string): Promise<void> {
  try {
    const resume = await ResumeModel.findById(resumeId);

    if (!resume) {
      logger.error({ resumeId }, "Resume not found for pipeline");
      return;
    }

    let currentStage = resume.pipelineStage || "pending";
    const rawText = resume.rawText;
    const jobDescription = resume.jobDescription ?? "";

    // Stage 1: Extract
    if (currentStage === "pending" || currentStage === "error") {
      await updateStage(resumeId, "extracting");
      currentStage = "extracting";
      logger.info({ resumeId }, "Starting extraction agent");
      const extracted = await extractionAgent(rawText);

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
      if (stopAtStage === "extracting") return;
    }

    // Stage 2: Gap Analysis
    if (currentStage === "extracting") {
      await updateStage(resumeId, "analyzing_gaps");
      currentStage = "analyzing_gaps";
      logger.info({ resumeId }, "Starting gap analysis agent");
      
      const skills = await ExtractedSkillModel.find({ resumeId });
      const extracted: any = { 
        skills: skills.map(s => s.toObject()),
        experienceYears: resume.experienceYears || 0,
        jobTitles: [],
        education: [],
        tools: []
      };

      const gaps = await gapAnalysisAgent(extracted, jobDescription);

      await SkillGapModel.deleteMany({ resumeId });
      if (gaps.length > 0) {
        await SkillGapModel.insertMany(
          gaps.map((g) => ({
            resumeId,
            missingSkill: g.missingSkill,
            importanceLevel: g.importanceLevel,
            suggestion: g.suggestion,
          }))
        );
      }
      if (stopAtStage === "analyzing_gaps") return;
    }

    // Stage 3: Suggestions
    if (currentStage === "analyzing_gaps") {
      await updateStage(resumeId, "generating_suggestions");
      currentStage = "generating_suggestions";
      logger.info({ resumeId }, "Starting suggestion agent");

      const gaps = await SkillGapModel.find({ resumeId });
      const suggestions = await suggestionAgent(
        gaps.map((g: any) => ({
          id: g._id.toString(),
          gapId: g._id.toString(),
          missingSkill: g.missingSkill,
          importanceLevel: g.importanceLevel as "critical" | "moderate" | "nice-to-have",
          suggestion: g.suggestion || "",
          bullets: [],
          applied: false
        })),
        rawText
      );

      for (const sugg of suggestions) {
        await SkillGapModel.findByIdAndUpdate(sugg.gapId, {
          suggestion: sugg.bullets.join(" | ")
        });
      }
      if (stopAtStage === "generating_suggestions") return;
    }

    // Stage 4 & 5: Rewrite & Validation
    if (currentStage === "generating_suggestions" || currentStage === "rewriting") {
      await updateStage(resumeId, "rewriting");
      currentStage = "rewriting";
      logger.info({ resumeId }, "Starting rewrite agent");

      const gaps = await SkillGapModel.find({ resumeId });
      const suggestions = gaps.map((g: any) => ({
        id: g._id.toString(),
        gapId: g._id.toString(),
        missingSkill: g.missingSkill,
        importanceLevel: g.importanceLevel,
        bullets: g.suggestion ? g.suggestion.split(" | ") : [],
        applied: false
      }));

      const rewrittenText = await rewriteAgent(rawText, suggestions);

      const versionCount = await ResumeVersionModel.countDocuments({ resumeId });
      const nextVersion = versionCount + 1;

      // Stage 5: Validation
      await updateStage(resumeId, "validating");
      currentStage = "validating";
      logger.info({ resumeId }, "Starting validation agent");
      const validation = await validationAgent(rewrittenText, jobDescription);

      await ResumeVersionModel.create({
        resumeId,
        versionNumber: nextVersion,
        content: rewrittenText,
        score: validation.atsScore,
      });

      await ValidationModel.deleteMany({ resumeId });
      await ValidationModel.create({
        resumeId,
        atsScore: validation.atsScore,
        keywordScore: validation.keywordScore,
        formattingScore: validation.formattingScore,
        skillMatchScore: validation.skillMatchScore,
        checklistResults: validation.checklist,
      });

      const matchScore = Math.round(
        validation.skillMatchScore * 0.6 + validation.keywordScore * 0.4
      );

      await ResumeModel.findByIdAndUpdate(resumeId, {
        pipelineStage: "complete",
        matchScore
      });

      logger.info({ resumeId, matchScore }, "Pipeline complete");
    }
  } catch (err) {
    logger.error({ resumeId, err }, "Pipeline failed");
    await updateStage(resumeId, "error");
  }
}

import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  resumesTable,
  resumeVersionsTable,
  extractedSkillsTable,
  skillGapsTable,
  validationsTable,
} from "@workspace/db";
import {
  UploadResumeBody,
  GetResumeParams,
  GetResumeStatusParams,
  GetExtractionParams,
  GetGapsParams,
  GetSuggestionsParams,
  GetRewriteParams,
  GetDiffParams,
  GetValidationParams,
  IterateResumeParams,
  GetVersionsParams,
  GetMatchScoreParams,
} from "@workspace/api-zod";
import { runPipeline } from "../../lib/pipeline";

const router: IRouter = Router();

// POST /resume/upload
router.post("/resume/upload", async (req, res): Promise<void> => {
  const parsed = UploadResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { rawText, jobDescription, jobTitle, company, portfolioUrl } =
    parsed.data;

  const [resume] = await db
    .insert(resumesTable)
    .values({
      rawText,
      jobDescription,
      jobTitle,
      company,
      portfolioUrl,
      pipelineStage: "pending",
      iteration: 1,
    })
    .returning();

  if (!resume) {
    res.status(500).json({ error: "Failed to create resume" });
    return;
  }

  // Run pipeline async (fire and forget)
  setImmediate(() => {
    runPipeline(resume.id).catch(() => {});
  });

  res.status(201).json(resume);
});

// GET /resume
router.get("/resume", async (_req, res): Promise<void> => {
  const resumes = await db
    .select()
    .from(resumesTable)
    .orderBy(desc(resumesTable.createdAt));
  res.json(resumes);
});

// GET /resume/:id
router.get("/resume/:id", async (req, res): Promise<void> => {
  const params = GetResumeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [resume] = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.id, params.data.id));

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  res.json(resume);
});

// GET /resume/:id/status
router.get("/resume/:id/status", async (req, res): Promise<void> => {
  const params = GetResumeStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [resume] = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.id, params.data.id));

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  const stageOrder = [
    "pending",
    "extracting",
    "analyzing_gaps",
    "generating_suggestions",
    "rewriting",
    "validating",
    "complete",
    "error",
  ];

  const currentIdx = stageOrder.indexOf(resume.pipelineStage);

  const stages = [
    { name: "extracting", label: "Extract Skills" },
    { name: "analyzing_gaps", label: "Analyze Gaps" },
    { name: "generating_suggestions", label: "Generate Suggestions" },
    { name: "rewriting", label: "Rewrite Resume" },
    { name: "validating", label: "Validate ATS" },
    { name: "complete", label: "Complete" },
  ].map((s) => {
    const stageIdx = stageOrder.indexOf(s.name);
    let status: string;
    if (resume.pipelineStage === "error") {
      status = stageIdx <= currentIdx ? "error" : "pending";
    } else if (stageIdx < currentIdx) {
      status = "complete";
    } else if (stageIdx === currentIdx) {
      status = resume.pipelineStage === "complete" ? "complete" : "running";
    } else {
      status = "pending";
    }
    return { name: s.name, label: s.label, status, completedAt: null };
  });

  res.json({
    resumeId: resume.id,
    stage: resume.pipelineStage,
    stages,
    matchScore: resume.matchScore,
  });
});

// GET /resume/:id/extraction
router.get("/resume/:id/extraction", async (req, res): Promise<void> => {
  const params = GetExtractionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [resume] = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.id, params.data.id));

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  const skills = await db
    .select()
    .from(extractedSkillsTable)
    .where(eq(extractedSkillsTable.resumeId, params.data.id));

  res.json({
    resumeId: params.data.id,
    skills,
    experienceYears: null,
    jobTitles: [],
    education: [],
    tools: skills
      .filter((s) => s.category === "technical")
      .map((s) => s.skillName),
  });
});

// GET /resume/:id/gaps
router.get("/resume/:id/gaps", async (req, res): Promise<void> => {
  const params = GetGapsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const gaps = await db
    .select()
    .from(skillGapsTable)
    .where(eq(skillGapsTable.resumeId, params.data.id));

  res.json(gaps);
});

// GET /resume/:id/suggestions
router.get("/resume/:id/suggestions", async (req, res): Promise<void> => {
  const params = GetSuggestionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const gaps = await db
    .select()
    .from(skillGapsTable)
    .where(eq(skillGapsTable.resumeId, params.data.id));

  const suggestions = gaps.map((gap) => ({
    id: gap.id,
    gapId: gap.id,
    missingSkill: gap.missingSkill,
    importanceLevel: gap.importanceLevel,
    bullets: gap.suggestion ? gap.suggestion.split(" | ") : [],
    applied: false,
  }));

  res.json(suggestions);
});

// GET /resume/:id/rewrite
router.get("/resume/:id/rewrite", async (req, res): Promise<void> => {
  const params = GetRewriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [resume] = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.id, params.data.id));

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  const [latestVersion] = await db
    .select()
    .from(resumeVersionsTable)
    .where(eq(resumeVersionsTable.resumeId, params.data.id))
    .orderBy(desc(resumeVersionsTable.versionNumber))
    .limit(1);

  if (!latestVersion) {
    res.status(404).json({ error: "No rewrite available yet" });
    return;
  }

  res.json({
    resumeId: params.data.id,
    originalText: resume.rawText,
    rewrittenText: latestVersion.content,
    versionNumber: latestVersion.versionNumber,
  });
});

// GET /resume/:id/diff
router.get("/resume/:id/diff", async (req, res): Promise<void> => {
  const params = GetDiffParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [resume] = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.id, params.data.id));

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  const [latestVersion] = await db
    .select()
    .from(resumeVersionsTable)
    .where(eq(resumeVersionsTable.resumeId, params.data.id))
    .orderBy(desc(resumeVersionsTable.versionNumber))
    .limit(1);

  if (!latestVersion) {
    res.status(404).json({ error: "No rewrite available yet" });
    return;
  }

  const original = resume.rawText;
  const rewritten = latestVersion.content;

  // Simple word-level diff
  const diffs = computeDiff(original, rewritten);
  const changeCount = diffs.filter((d) => d.type !== "equal").length;

  res.json({
    resumeId: params.data.id,
    originalText: original,
    rewrittenText: rewritten,
    changeCount,
    diffs,
  });
});

// GET /resume/:id/validation
router.get("/resume/:id/validation", async (req, res): Promise<void> => {
  const params = GetValidationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [validation] = await db
    .select()
    .from(validationsTable)
    .where(eq(validationsTable.resumeId, params.data.id))
    .limit(1);

  if (!validation) {
    res.status(404).json({ error: "Validation not available yet" });
    return;
  }

  const checklist = (validation.checklistResults as Array<{
    item: string;
    passed: boolean;
    detail: string | null;
  }> | null) ?? [];

  res.json({
    resumeId: params.data.id,
    atsScore: validation.atsScore,
    keywordScore: validation.keywordScore,
    formattingScore: validation.formattingScore,
    skillMatchScore: validation.skillMatchScore,
    checklist,
  });
});

// POST /resume/:id/iterate
router.post("/resume/:id/iterate", async (req, res): Promise<void> => {
  const params = IterateResumeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [resume] = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.id, params.data.id));

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  const [updated] = await db
    .update(resumesTable)
    .set({
      pipelineStage: "pending",
      iteration: resume.iteration + 1,
    })
    .where(eq(resumesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(500).json({ error: "Failed to update resume" });
    return;
  }

  setImmediate(() => {
    runPipeline(params.data.id).catch(() => {});
  });

  res.json(updated);
});

// GET /resume/:id/versions
router.get("/resume/:id/versions", async (req, res): Promise<void> => {
  const params = GetVersionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const versions = await db
    .select()
    .from(resumeVersionsTable)
    .where(eq(resumeVersionsTable.resumeId, params.data.id))
    .orderBy(desc(resumeVersionsTable.versionNumber));

  res.json(versions);
});

// GET /resume/:id/match-score
router.get("/resume/:id/match-score", async (req, res): Promise<void> => {
  const params = GetMatchScoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [resume] = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.id, params.data.id));

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  const score = resume.matchScore ?? 0;
  let label = "Needs Work";
  if (score >= 80) label = "Excellent Match";
  else if (score >= 65) label = "Good Match";
  else if (score >= 50) label = "Fair Match";

  res.json({
    resumeId: resume.id,
    score,
    label,
  });
});

function computeDiff(
  original: string,
  rewritten: string
): Array<{ type: string; text: string }> {
  const origWords = original.split(/(\s+)/);
  const newWords = rewritten.split(/(\s+)/);

  const diffs: Array<{ type: string; text: string }> = [];
  const maxLen = Math.max(origWords.length, newWords.length);

  let i = 0;
  let j = 0;

  while (i < origWords.length || j < newWords.length) {
    if (i >= origWords.length) {
      diffs.push({ type: "added", text: newWords[j] ?? "" });
      j++;
    } else if (j >= newWords.length) {
      diffs.push({ type: "removed", text: origWords[i] ?? "" });
      i++;
    } else if (origWords[i] === newWords[j]) {
      diffs.push({ type: "equal", text: origWords[i] ?? "" });
      i++;
      j++;
    } else {
      diffs.push({ type: "removed", text: origWords[i] ?? "" });
      diffs.push({ type: "added", text: newWords[j] ?? "" });
      i++;
      j++;
    }

    if (diffs.length > maxLen * 3) break;
  }

  return diffs;
}

export default router;

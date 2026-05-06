import { Router, type IRouter } from "express";
import multer from "multer";
import pdf from "pdf-parse";
import {
  resumesTable as ResumeModel,
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
import { runPipeline } from "../../lib/pipeline.js";
import {
  extractedSkillsTable as ExtractedSkillModel,
  skillGapsTable as SkillGapModel,
  resumeVersionsTable as ResumeVersionModel,
  validationsTable as ValidationModel,
} from "@workspace/db";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to map Mongoose documents to API response format
const mapResume = (doc: any) => ({
  ...doc.toObject(),
  id: doc._id.toString(),
  createdAt: doc.createdAt.toISOString(),
});

// POST /resume/upload
// Now supports both JSON (rawText) and Multipart (file upload)
router.post("/resume/upload", upload.single("resumeFile"), async (req, res): Promise<void> => {
  try {
    let rawText: string | undefined;
    let jobDescription: string | undefined;
    let jobTitle: string | undefined;
    let company: string | undefined;
    let portfolioUrl: string | undefined;

    if (req.file) {
      // PDF Upload mode
      try {
        const data = await pdf(req.file.buffer);
        rawText = data.text;
        
        // Other fields come from req.body in multipart form
        jobDescription = req.body.jobDescription;
        jobTitle = req.body.jobTitle;
        company = req.body.company;
        portfolioUrl = req.body.portfolioUrl;
      } catch (err) {
        console.error("PDF parse error:", err);
        res.status(400).json({ error: "Failed to parse PDF file. Please try pasting the text instead." });
        return;
      }
    } else {
      // JSON mode
      const parsed = UploadResumeBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }
      ({ rawText, jobDescription, jobTitle, company, portfolioUrl } = parsed.data);
    }

    if (!rawText || !jobDescription) {
      res.status(400).json({ error: "Resume text and job description are required" });
      return;
    }

    const resume = await ResumeModel.create({
      rawText,
      jobDescription,
      jobTitle,
      company,
      portfolioUrl,
      pipelineStage: "pending",
      iteration: 1,
    });

    if (!resume) {
      res.status(500).json({ error: "Failed to create resume in database" });
      return;
    }

    const mapped = mapResume(resume);

    // Run pipeline async (fire and forget)
    // Note: On Vercel, this might be cut short. 
    // Ideally use a background job/webhook.
    setImmediate(() => {
      runPipeline(mapped.id).catch(err => {
        console.error("Pipeline error:", err);
      });
    });

    res.status(201).json(mapped);
  } catch (error: any) {
    console.error("Critical upload error:", error);
    res.status(500).json({ 
      error: "Internal server error during upload", 
      details: process.env.NODE_ENV === "development" ? error.message : undefined 
    });
  }
});

// GET /resume
router.get("/resume", async (_req, res): Promise<void> => {
  const resumes = await ResumeModel.find().sort({ createdAt: -1 });
  res.json(resumes.map(mapResume));
});

// GET /resume/:id
router.get("/resume/:id", async (req, res): Promise<void> => {
  const params = GetResumeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const resume = await ResumeModel.findById(params.data.id);

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  res.json(mapResume(resume));
});

// GET /resume/:id/status
router.get("/resume/:id/status", async (req, res): Promise<void> => {
  const params = GetResumeStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const resume = await ResumeModel.findById(params.data.id);

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

  const currentIdx = stageOrder.indexOf(resume.pipelineStage || "pending");

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
    resumeId: resume._id.toString(),
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

  const resume = await ResumeModel.findById(params.data.id);

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  const skills = await ExtractedSkillModel.find({ resumeId: params.data.id });

  res.json({
    resumeId: params.data.id,
    skills: skills.map((s: any) => ({ ...s.toObject(), id: s._id.toString() })),
    experienceYears: null,
    jobTitles: [],
    education: [],
    tools: skills
      .filter((s: any) => s.category === "technical")
      .map((s: any) => s.skillName),
  });
});

// GET /resume/:id/gaps
router.get("/resume/:id/gaps", async (req, res): Promise<void> => {
  const params = GetGapsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const gaps = await SkillGapModel.find({ resumeId: params.data.id });

  res.json(gaps.map((g: any) => ({ ...g.toObject(), id: g._id.toString() })));
});

// GET /resume/:id/suggestions
router.get("/resume/:id/suggestions", async (req, res): Promise<void> => {
  const params = GetSuggestionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const gaps = await SkillGapModel.find({ resumeId: params.data.id });

  const suggestions = gaps.map((gap: any) => ({
    id: gap._id.toString(),
    gapId: gap._id.toString(),
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

  const resume = await ResumeModel.findById(params.data.id);

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  const latestVersion = await ResumeVersionModel.findOne({ resumeId: params.data.id })
    .sort({ versionNumber: -1 });

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

  const resume = await ResumeModel.findById(params.data.id);

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  const latestVersion = await ResumeVersionModel.findOne({ resumeId: params.data.id })
    .sort({ versionNumber: -1 });

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

  const validation = await ValidationModel.findOne({ resumeId: params.data.id });

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

  const resume = await ResumeModel.findById(params.data.id);

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  const updated = await ResumeModel.findByIdAndUpdate(params.data.id, {
    pipelineStage: "pending",
    iteration: (resume.iteration || 0) + 1,
  }, { new: true });

  if (!updated) {
    res.status(500).json({ error: "Failed to update resume" });
    return;
  }

  setImmediate(() => {
    runPipeline(params.data.id).catch(() => {});
  });

  res.json(mapResume(updated));
});

// GET /resume/:id/versions
router.get("/resume/:id/versions", async (req, res): Promise<void> => {
  const params = GetVersionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const versions = await ResumeVersionModel.find({ resumeId: params.data.id })
    .sort({ versionNumber: -1 });

  res.json(versions.map((v: any) => ({
    ...v.toObject(),
    id: v._id.toString(),
    resumeId: v.resumeId.toString(),
    createdAt: v.createdAt.toISOString(),
  })));
});

// GET /resume/:id/match-score
router.get("/resume/:id/match-score", async (req, res): Promise<void> => {
  const params = GetMatchScoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const resume = await ResumeModel.findById(params.data.id);

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
    resumeId: resume._id.toString(),
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

# ResumeLift

AI-powered resume analyzer that extracts skills, identifies gaps, generates suggestions, rewrites resumes, and validates ATS compatibility through a 5-stage LLM pipeline.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit OpenAI proxy (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifacts/resume-analyzer)
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI GPT-5.4 via Replit AI Integrations (@workspace/integrations-openai-ai-server)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (resumes, resume_versions, extracted_skills, skill_gaps, validations, job_descriptions)
- `artifacts/api-server/src/lib/agents/` — 5 AI agent classes (extraction, gap_analysis, suggestion, rewrite, validation)
- `artifacts/api-server/src/lib/pipeline.ts` — Pipeline orchestrator that chains agents
- `artifacts/api-server/src/routes/resume/` — All resume API route handlers
- `artifacts/resume-analyzer/src/pages/analyzer.tsx` — Main single-page analyzer UI

## Architecture decisions

- Pipeline runs async via `setImmediate` so upload responds immediately with `resumeId`
- No Redis/Celery — pipeline state tracked via `pipelineStage` column in PostgreSQL
- Frontend polls `/api/resume/{id}/status` every 2 seconds while pipeline is running
- Diff is computed server-side with a word-level diff algorithm (no external library needed)
- Each pipeline stage clears and re-inserts its DB rows to support iteration (re-runs)
- Orval `mode: "single"` for zod output; codegen script patches `index.ts` to avoid duplicate exports

## Product

- Upload resume text + job description → trigger 5-stage AI pipeline
- Stage 1 Extraction: skills, experience, job titles, education extracted by GPT-5.4
- Stage 2 Gap Analysis: semantic skill gaps with importance levels (critical/moderate/nice-to-have)
- Stage 3 Suggestions: 3-5 specific actionable bullets per gap
- Stage 4 Rewrite: full resume rewritten incorporating all suggestions
- Stage 5 Validation: ATS score (0-100) with breakdown (keyword 30%, formatting 20%, skill match 50%)
- Diff viewer shows before/after changes with change count
- Version history tracks every iteration run with scores
- Match score badge updated live as pipeline completes

## Gotchas

- Codegen patches `lib/api-zod/src/index.ts` after orval runs (see api-spec/package.json codegen script)
- Run codegen with `pnpm --filter @workspace/api-spec run codegen` — not bare orval
- Do NOT add `schemas: { path, type }` to orval zod config — it causes duplicate exports
- Pipeline is async — poll `/api/resume/{id}/status` to track progress

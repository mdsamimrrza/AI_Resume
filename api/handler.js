// This file is plain JavaScript so Vercel does NOT typecheck it.
// It imports the pre-compiled Express app from the esbuild output.
// @ts-nocheck

export { default } from "../backend/dist/vercel-handler.mjs";

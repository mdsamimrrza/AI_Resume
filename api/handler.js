// Explicit ESM import and export to satisfy Vercel's bundler
import baseHandler from "../backend/dist/vercel-handler.mjs";

export default async function handler(req, res) {
  // 1. Set CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Max-Age", "86400"); // Cache preflight for 24 hours

  // 2. Early return for OPTIONS preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 3. Delegate to the main Express handler
  try {
    return await baseHandler(req, res);
  } catch (err) {
    console.error("Vercel Handler Crash:", err);
    return res.status(500).json({ 
      error: "Internal Server Error (Vercel Handler)", 
      details: err.message 
    });
  }
}

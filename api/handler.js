// Explicit ESM import and export to satisfy Vercel's bundler
import baseHandler from "../backend/dist/vercel-handler.mjs";

export default async function handler(req, res) {
  // Explicitly handle OPTIONS for CORS preflight on Vercel
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    return res.status(200).end();
  }

  try {
    return await baseHandler(req, res);
  } catch (err) {
    console.error("Vercel Handler Crash:", err);
    return res.status(500).json({ 
      error: "Vercel Handler Crash", 
      details: err.message,
      stack: err.stack 
    });
  }
}

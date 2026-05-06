import { useGetRewrite, getGetRewriteQueryKey } from "@workspace/api-client-react";
import { Loader2, Download, Copy, CheckCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState } from "react";

// ─── Resume text parser ────────────────────────────────────────────────────
type LineType = "name" | "heading" | "subheading" | "bullet" | "meta" | "blank" | "body";

interface ParsedLine {
  type: LineType;
  text: string;
}

function parseLine(line: string, index: number): ParsedLine {
  const t = line.trim();
  if (!t) return { type: "blank", text: "" };

  // Detect name — first non-empty line is usually the name
  if (index === 0) return { type: "name", text: t };

  // Section headings: ALL CAPS only (≥3 chars), or ## prefix, or **text**
  const allCaps = t === t.toUpperCase() && /[A-Z]/.test(t) && t.length >= 3;
  if (allCaps || t.startsWith("## ") || (t.startsWith("**") && t.endsWith("**") && !t.slice(2, -2).includes(" | "))) {
    return { type: "heading", text: t.replace(/^#+\s*/, "").replace(/\*\*/g, "") };
  }

  // Subheadings — job title lines (e.g. "Company Name | 2020–2023")
  if (t.includes("|") || t.includes("•") && t.split("•").length < 4) {
    return { type: "subheading", text: t };
  }

  // Bullets
  if (t.startsWith("- ") || t.startsWith("* ") || t.startsWith("• ")) {
    return { type: "bullet", text: t.replace(/^[-*•]\s*/, "") };
  }

  // Email / phone / URL meta lines
  if (/[@\d\(\)\/\\]/.test(t) && t.length < 80) {
    return { type: "meta", text: t };
  }

  return { type: "body", text: t };
}

function parseResume(text: string): ParsedLine[] {
  const rawLines = text.split("\n");
  let firstNonEmpty = true;
  return rawLines.map((line) => {
    const t = line.trim();
    if (!t) return { type: "blank" as LineType, text: "" };
    const idx = firstNonEmpty ? 0 : 1;
    if (firstNonEmpty) firstNonEmpty = false;
    return parseLine(line, idx);
  });
}

// ─── Resume renderer ───────────────────────────────────────────────────────
function ResumeDocument({ text }: { text: string }) {
  const lines = parseResume(text);

  return (
    <div
      className="bg-white text-gray-900 rounded-xl shadow-lg border border-gray-200 mx-auto"
      style={{ maxWidth: 720, fontFamily: "'Georgia', serif", padding: "40px 48px", lineHeight: 1.6 }}
    >
      {lines.map((line, i) => {
        switch (line.type) {
          case "name":
            return (
              <h1 key={i} style={{ fontSize: 26, fontWeight: 700, marginBottom: 2, letterSpacing: -0.5, color: "#111" }}>
                {line.text}
              </h1>
            );
          case "meta":
            return (
              <p key={i} style={{ fontSize: 11, color: "#555", marginBottom: 14, fontFamily: "sans-serif" }}>
                {line.text}
              </p>
            );
          case "heading":
            return (
              <div key={i} style={{ marginTop: 22, marginBottom: 6, paddingBottom: 3, borderBottom: "2px solid #7c3aed" }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#7c3aed", fontFamily: "sans-serif" }}>
                  {line.text}
                </span>
              </div>
            );
          case "subheading":
            return (
              <p key={i} style={{ fontSize: 13, fontWeight: 600, color: "#222", marginTop: 10, marginBottom: 2, fontFamily: "sans-serif" }}>
                {line.text}
              </p>
            );
          case "bullet":
            return (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3, marginLeft: 8, fontSize: 12 }}>
                <span style={{ color: "#7c3aed", marginTop: 2, flexShrink: 0 }}>▸</span>
                <span style={{ color: "#333" }}>{line.text}</span>
              </div>
            );
          case "blank":
            return <div key={i} style={{ height: 6 }} />;
          default:
            return (
              <p key={i} style={{ fontSize: 12, color: "#444", marginBottom: 3 }}>
                {line.text}
              </p>
            );
        }
      })}
    </div>
  );
}

// ─── PDF generation ────────────────────────────────────────────────────────
function generatePDF(text: string) {
  const lines = parseResume(text);

  const bodyHtml = lines.map((line) => {
    switch (line.type) {
      case "name":
        return `<h1 style="font-size:22pt;font-weight:700;margin:0 0 2px;letter-spacing:-0.5px;">${line.text}</h1>`;
      case "meta":
        return `<p style="font-size:9pt;color:#555;margin:0 0 12px;font-family:sans-serif;">${line.text}</p>`;
      case "heading":
        return `<div style="margin-top:18px;margin-bottom:5px;padding-bottom:3px;border-bottom:2px solid #7c3aed;"><span style="font-size:9pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#7c3aed;font-family:sans-serif;">${line.text}</span></div>`;
      case "subheading":
        return `<p style="font-size:11pt;font-weight:600;color:#222;margin:8px 0 2px;font-family:sans-serif;">${line.text}</p>`;
      case "bullet":
        return `<div style="display:flex;gap:8px;margin:0 0 3px 8px;font-size:10pt;"><span style="color:#7c3aed;flex-shrink:0;">▸</span><span>${line.text}</span></div>`;
      case "blank":
        return `<div style="height:5px"></div>`;
      default:
        return `<p style="font-size:10pt;color:#444;margin:0 0 3px;">${line.text}</p>`;
    }
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Rewritten Resume</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Georgia&family=Inter:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; color: #111; background: #fff; padding: 36px 48px; max-width: 760px; margin: 0 auto; line-height: 1.6; }
  @media print { body { padding: 15mm 20mm; } @page { margin: 0; size: A4; } }
</style></head><body>${bodyHtml}</body></html>`;

  const win = window.open("", "_blank", "width=820,height=1060");
  if (!win) { alert("Please allow pop-ups to download the PDF."); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}

// ─── Component ─────────────────────────────────────────────────────────────
export function RewriteTab({ resumeId }: { resumeId: string | null }) {
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useGetRewrite((resumeId as any) ?? "", {
    query: {
      enabled: !!resumeId,
      queryKey: getGetRewriteQueryKey((resumeId as any) ?? ""),
    }
  });

  const handleCopy = () => {
    if (data?.rewrittenText) {
      navigator.clipboard.writeText(data.rewrittenText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!resumeId) return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
      <FileText className="w-12 h-12 opacity-30" />
      <p>Upload a resume to see the AI rewrite.</p>
    </div>
  );

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-green-500" />
      <p className="text-muted-foreground">Rewriting your resume with AI...</p>
    </div>
  );

  const text = data?.rewrittenText || "";
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-green-500">Rewritten Resume</h2>
          <p className="text-muted-foreground mt-1">AI-optimized — rendered in resume format.</p>
        </div>
        <div className="flex items-center gap-2">
          {text && (
            <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/5">
              {wordCount} words
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleCopy} className="border-green-500/30 hover:bg-green-500/10 text-green-500">
            {copied ? <CheckCheck className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copied!" : "Copy Text"}
          </Button>
          <Button onClick={() => generatePDF(text)} disabled={!text} className="bg-green-600 hover:bg-green-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Paper-style resume document */}
      <div className="bg-gray-100 dark:bg-zinc-900 rounded-xl p-6">
        {text ? (
          <ResumeDocument text={text} />
        ) : (
          <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-400 max-w-[720px] mx-auto">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-green-500" />
            <p>Waiting for the rewrite to complete…</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
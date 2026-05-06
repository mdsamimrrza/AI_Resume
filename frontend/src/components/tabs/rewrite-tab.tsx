import { useGetRewrite, getGetRewriteQueryKey } from "@workspace/api-client-react";
import { Loader2, Download, Copy, CheckCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState } from "react";
import { parseResume } from "@/lib/resume-format";

function ResumeDocument({ text }: { text: string }) {
  const lines = parseResume(text);

  return (
    <div className="w-full pb-4">
      <div
        className="w-full max-w-[760px] bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 mx-auto transition-all duration-500 hover:shadow-cyan-500/10"
        style={{
          fontFamily: "'Inter', 'Georgia', serif",
          padding: "clamp(20px, 4vw, 48px) clamp(18px, 5vw, 60px)",
          lineHeight: 1.5,
          position: "relative",
        }}
      >
        {lines.map((line, i) => {
          switch (line.type) {
            case "name":
              return (
                <h1
                  key={i}
                  style={{
                    fontSize: "clamp(24px, 4vw, 32px)",
                    fontWeight: 800,
                    marginBottom: 4,
                    letterSpacing: -1,
                    color: "#000",
                    textAlign: "center",
                    overflowWrap: "anywhere",
                  }}
                >
                  {line.text}
                </h1>
              );
            case "meta":
              return (
                <p
                  key={i}
                  style={{
                    fontSize: 12,
                    color: "#666",
                    marginBottom: 8,
                    textAlign: "center",
                    fontWeight: 500,
                    overflowWrap: "anywhere",
                  }}
                >
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
            case "subheading": {
              let titlePart = line.text;
              let datePart = "";
              const dateMatch = line.text.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b.*$/i);
              if (dateMatch) {
                datePart = dateMatch[0];
                titlePart = line.text.replace(datePart, "").trim();
              }
              const titlePieces = titlePart.split("|");
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 10, marginBottom: 2, fontFamily: "sans-serif", overflowWrap: "anywhere" }}>
                  <p style={{ fontSize: 13, color: "#222" }}>
                    <span style={{ fontWeight: 800 }}>{titlePieces[0].trim()}</span>
                    {titlePieces.length > 1 && (
                      <span style={{ fontWeight: 600 }}> | {titlePieces.slice(1).join(" | ").trim()}</span>
                    )}
                  </p>
                  {datePart && (
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#444", flexShrink: 0, marginLeft: 16 }}>
                      {datePart}
                    </p>
                  )}
                </div>
              );
            }
            case "bullet":
              return (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 4, marginLeft: 12, fontSize: 13 }}>
                  <span style={{ color: "#7c3aed", marginTop: 4, flexShrink: 0, fontSize: 8 }}>•</span>
                  <span style={{ color: "#444", overflowWrap: "anywhere" }}>{line.text}</span>
                </div>
              );
            case "blank":
              return <div key={i} style={{ height: 6 }} />;
            default: {
              let content = line.text;
              if (content.includes(":")) {
                const parts = content.split(":");
                if (parts[0].length < 30) {
                  return (
                    <p key={i} style={{ fontSize: 12, color: "#444", marginBottom: 3, overflowWrap: "anywhere" }}>
                      <strong style={{ color: "#222" }}>{parts[0]}:</strong>{parts.slice(1).join(":")}
                    </p>
                  );
                }
              }
              return <p key={i} style={{ fontSize: 12, color: "#444", marginBottom: 3, overflowWrap: "anywhere" }}>{line.text}</p>;
            }
          }
        })}
      </div>
    </div>
  );
}

function generatePDF(text: string) {
  const lines = parseResume(text);
  const bodyHtml = lines.map((line) => {
    switch (line.type) {
      case "name":
        return `<h1 style="font-size:22pt;font-weight:700;margin:0 0 2px;letter-spacing:-0.5px;text-align:center;">${line.text}</h1>`;
      case "meta":
        return `<p style="font-size:9pt;color:#666;margin:0 0 8px;text-align:center;font-family:sans-serif;font-weight:500;">${line.text}</p>`;
      case "heading":
        return `<div style="margin-top:18px;margin-bottom:5px;padding-bottom:3px;border-bottom:2px solid #7c3aed;"><span style="font-size:9pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#7c3aed;font-family:sans-serif;">${line.text}</span></div>`;
      case "subheading": {
        let titlePart = line.text;
        let datePart = "";
        const dateMatch = line.text.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b.*$/i);
        if (dateMatch) {
          datePart = dateMatch[0];
          titlePart = line.text.replace(datePart, "").trim();
        }
        const titlePieces = titlePart.split("|");
        const mainTitle = `<span style="font-weight:800">${titlePieces[0].trim()}</span>`;
        const subTitle = titlePieces.length > 1 ? `<span style="font-weight:600"> | ${titlePieces.slice(1).join(" | ").trim()}</span>` : "";
        const leftSide = `<p style="font-size:11pt;color:#222;margin:0;">${mainTitle}${subTitle}</p>`;
        const rightSide = datePart ? `<p style="font-size:10pt;font-weight:600;color:#444;margin:0;white-space:nowrap;margin-left:16px;">${datePart}</p>` : "";
        
        return `<div style="display:flex;justify-content:space-between;align-items:flex-end;margin:8px 0 2px;font-family:sans-serif;">
          ${leftSide}
          ${rightSide}
        </div>`;
      }
      case "bullet":
        return `<div style="display:flex;gap:8px;margin:0 0 3px 8px;font-size:10pt;"><span style="color:#7c3aed;flex-shrink:0;">•</span><span>${line.text}</span></div>`;
      case "blank":
        return `<div style="height:5px"></div>`;
      default: {
        let content = line.text;
        if (content.includes(":")) {
          const parts = content.split(":");
          if (parts[0].length < 30) {
            content = `<strong style="color:#222">${parts[0]}:</strong>${parts.slice(1).join(":")}`;
          }
        }
        return `<p style="font-size:10pt;color:#444;margin:0 0 3px;">${content}</p>`;
      }
    }
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Rewritten Resume</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Georgia&family=Inter:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; color: #111; background: #fff; padding: 36px 48px; max-width: 760px; margin: 0 auto; line-height: 1.6; }
  @media print { body { padding: 10mm 15mm; } @page { margin: 0; size: A4; } }
</style></head><body>${bodyHtml}<script>window.onload = () => { setTimeout(() => { window.print(); }, 500); }</script></body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    const link = document.createElement("a");
    link.href = url;
    link.download = "resume-optimized.html";
    link.click();
    alert("Popup blocked! We downloaded an HTML version you can print manually.");
  }
}

export function RewriteTab({ resumeId, pipelineStage }: { resumeId: string | null; pipelineStage: string | null }) {
  const [copied, setCopied] = useState(false);
  const { data, isLoading } = useGetRewrite((resumeId as any) ?? "", {
    query: { enabled: !!resumeId, queryKey: getGetRewriteQueryKey((resumeId as any) ?? "") },
  });

  const handleCopy = () => {
    if (data?.rewrittenText) {
      const cleanText = data.rewrittenText.replace(/\[OPTIMIZATION NOTICE:[\s\S]*?\]\n*/g, "");
      navigator.clipboard.writeText(cleanText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!resumeId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
        <FileText className="w-12 h-12 opacity-30" />
        <p>Upload a resume to see the AI rewrite.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-green-500" />
        <p className="text-muted-foreground">Rewriting your resume with AI...</p>
      </div>
    );
  }

  const rawText = data?.rewrittenText || "";
  const text = rawText.replace(/\[OPTIMIZATION NOTICE:[\s\S]*?\]\n*/g, "");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const rewriteReady = ["rewriting", "validating", "complete"].includes(pipelineStage ?? "");

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-green-500">Rewritten Resume</h2>
          <p className="text-muted-foreground mt-1">AI-optimized - rendered in resume format.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {text && <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/5">{wordCount} words</Badge>}
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
      <div className="bg-gray-100 dark:bg-zinc-900 rounded-xl p-3 sm:p-6 lg:p-8">
        {text ? (
          <ResumeDocument text={text} />
        ) : (
          <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-400 max-w-[760px] mx-auto">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-green-500" />
            <p>{rewriteReady ? "Final rewrite is being assembled..." : "Rewrite is still running. Please wait a moment."}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

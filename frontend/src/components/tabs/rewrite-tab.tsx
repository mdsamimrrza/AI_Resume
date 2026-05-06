import { useGetRewrite, getGetRewriteQueryKey } from "@workspace/api-client-react";
import { Loader2, Download, Copy, CheckCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState } from "react";
import { parseResume } from "@/lib/resume-format";

function ResumeDocument({ text }: { text: string }) {
  const lines = parseResume(text);
  const S = {
    wrap: { fontFamily: "'Times New Roman', Georgia, serif", lineHeight: 1.45, color: "#111" } as React.CSSProperties,
    name: { fontSize: "clamp(20px, 3.5vw, 26px)", fontWeight: 700, textAlign: "center" as const, letterSpacing: 0, marginBottom: 2 },
    meta: { fontSize: 11, textAlign: "center" as const, color: "#222", marginBottom: 6, overflowWrap: "anywhere" as const },
    heading: { marginTop: 16, marginBottom: 3, paddingBottom: 2, borderBottom: "1.5px solid #111" },
    headingText: { fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, color: "#111", fontFamily: "sans-serif" },
    subRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 7, marginBottom: 1, gap: 8 },
    subLeft: { fontSize: 12, color: "#111", flex: 1 },
    subDate: { fontSize: 11, color: "#333", flexShrink: 0, fontStyle: "italic" as const },
    bullet: { display: "flex", gap: 8, marginBottom: 3, marginLeft: 14, fontSize: 11 },
    bulletDot: { color: "#111", flexShrink: 0, marginTop: 1, fontSize: 11 },
    bulletText: { color: "#222", overflowWrap: "anywhere" as const },
    body: { fontSize: 11, color: "#222", marginBottom: 3, overflowWrap: "anywhere" as const },
    blank: { height: 5 },
  };

  return (
    <div className="w-full pb-4">
      <div
        className="w-full max-w-[760px] bg-white rounded-xl shadow-2xl border border-gray-200 mx-auto"
        style={{ ...S.wrap, padding: "clamp(20px, 4vw, 44px) clamp(20px, 5vw, 56px)" }}
      >
        {lines.map((line, i) => {
          switch (line.type) {
            case "name":
              return <h1 key={i} style={S.name}>{line.text}</h1>;
            case "meta":
              return <p key={i} style={S.meta}>{line.text}</p>;
            case "heading":
              return (
                <div key={i} style={S.heading}>
                  <span style={S.headingText}>{line.text}</span>
                </div>
              );
            case "subheading": {
              let titlePart = line.text;
              let datePart = "";
              const dateMatch = line.text.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-–]+(?:\d{4}|Present)(?:[\s\-–]+(?:\d{4}|Present))?\b/i);
              if (dateMatch) {
                datePart = dateMatch[0].trim();
                titlePart = line.text.replace(dateMatch[0], "").trim();
              }
              const pieces = titlePart.split("|");
              return (
                <div key={i} style={S.subRow}>
                  <p style={S.subLeft}>
                    <strong>{pieces[0].trim()}</strong>
                    {pieces.length > 1 && <span style={{ fontWeight: 400 }}> | {pieces.slice(1).join(" | ").trim()}</span>}
                  </p>
                  {datePart && <span style={S.subDate}>{datePart}</span>}
                </div>
              );
            }
            case "bullet":
              return (
                <div key={i} style={S.bullet}>
                  <span style={S.bulletDot}>•</span>
                  <span style={S.bulletText}>{line.text.replace(/^[-–•*]\s*/, "")}</span>
                </div>
              );
            case "blank":
              return <div key={i} style={S.blank} />;
            default: {
              if (line.text.includes(":")) {
                const idx = line.text.indexOf(":");
                const label = line.text.slice(0, idx);
                const rest = line.text.slice(idx + 1);
                if (label.length < 30) {
                  return (
                    <p key={i} style={S.body}>
                      <strong>{label}:</strong>{rest}
                    </p>
                  );
                }
              }
              return <p key={i} style={S.body}>{line.text}</p>;
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
        return `<h1 style="font-size:18pt;font-weight:700;margin:0 0 2px;text-align:center;font-family:'Times New Roman',serif;">${line.text}</h1>`;
      case "meta":
        return `<p style="font-size:9pt;color:#222;margin:0 0 6px;text-align:center;">${line.text}</p>`;
      case "heading":
        return `<div style="margin-top:14px;margin-bottom:3px;padding-bottom:2px;border-bottom:1.5px solid #111;"><span style="font-size:9pt;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#111;font-family:Arial,sans-serif;">${line.text}</span></div>`;
      case "subheading": {
        let titlePart = line.text;
        let datePart = "";
        const dateMatch = line.text.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-–]+(?:\d{4}|Present)(?:[\s\-–]+(?:\d{4}|Present))?\b/i);
        if (dateMatch) {
          datePart = dateMatch[0].trim();
          titlePart = line.text.replace(dateMatch[0], "").trim();
        }
        const pieces = titlePart.split("|");
        const leftHtml = `<span style="font-weight:700">${pieces[0].trim()}</span>${pieces.length > 1 ? ` | ${pieces.slice(1).join(" | ").trim()}` : ""}`;
        const rightHtml = datePart ? `<span style="font-style:italic;color:#333;">${datePart}</span>` : "";
        return `<div style="display:flex;justify-content:space-between;align-items:baseline;margin:6px 0 1px;gap:8px;"><p style="font-size:10pt;margin:0;">${leftHtml}</p>${rightHtml ? `<p style="font-size:9pt;margin:0;white-space:nowrap;">${rightHtml}</p>` : ""}</div>`;
      }
      case "bullet":
        return `<div style="display:flex;gap:6px;margin:0 0 2px 12px;font-size:9.5pt;"><span style="flex-shrink:0;">•</span><span>${line.text.replace(/^[-•*]\s*/, "")}</span></div>`;
      case "blank":
        return `<div style="height:4px"></div>`;
      default: {
        if (line.text.includes(":")) {
          const idx = line.text.indexOf(":");
          const label = line.text.slice(0, idx);
          const rest = line.text.slice(idx + 1);
          if (label.length < 30) {
            return `<p style="font-size:9.5pt;color:#111;margin:0 0 2px;"><strong>${label}:</strong>${rest}</p>`;
          }
        }
        return `<p style="font-size:9.5pt;color:#222;margin:0 0 2px;">${line.text}</p>`;
      }
    }
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Rewritten Resume</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Georgia, serif; color: #111; background: #fff; padding: 28px 40px; max-width: 740px; margin: 0 auto; line-height: 1.45; }
  @media print { body { padding: 8mm 12mm; } @page { margin: 0; size: A4; } }
</style></head><body>${bodyHtml}<script>window.onload = () => { setTimeout(() => { window.print(); }, 400); }</script></body></html>`;

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

import { useGetDiff, getGetDiffQueryKey } from "@workspace/api-client-react";
import { Loader2, SplitSquareHorizontal, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { classifyResumeLine, normalizeResumeText } from "@/lib/resume-format";

interface DiffLine {
  text: string;
  lineType: "added" | "removed" | "equal";
}

function buildDiffLines(originalText: string, rewrittenText: string): DiffLine[] {
  const original = normalizeResumeText(originalText).split("\n").map((line) => line.trim());
  const rewritten = normalizeResumeText(rewrittenText).split("\n").map((line) => line.trim());
  const lines: DiffLine[] = [];

  let i = 0;
  let j = 0;

  while (i < original.length || j < rewritten.length) {
    const left = original[i] ?? "";
    const right = rewritten[j] ?? "";

    if (left === right) {
      lines.push({ text: left, lineType: "equal" });
      i += 1;
      j += 1;
      continue;
    }

    if (right && original[i + 1] === right) {
      lines.push({ text: left, lineType: "removed" });
      i += 1;
      continue;
    }

    if (left && rewritten[j + 1] === left) {
      lines.push({ text: right, lineType: "added" });
      j += 1;
      continue;
    }

    if (left) {
      lines.push({ text: left, lineType: "removed" });
      i += 1;
    }

    if (right) {
      lines.push({ text: right, lineType: "added" });
      j += 1;
    }
  }

  return lines;
}

function DiffResumeLine({ diffLine, isFirst }: { diffLine: DiffLine; isFirst: boolean }) {
  const lt = classifyResumeLine(diffLine.text, isFirst);
  const rowBg =
    diffLine.lineType === "added"
      ? "bg-green-50 dark:bg-green-950/30"
      : diffLine.lineType === "removed"
        ? "bg-red-50 dark:bg-red-950/30"
        : "";
  const gutter =
    diffLine.lineType === "added" ? (
      <span className="text-green-500 font-bold text-xs w-4 shrink-0">+</span>
    ) : diffLine.lineType === "removed" ? (
      <span className="text-red-400 font-bold text-xs w-4 shrink-0">-</span>
    ) : (
      <span className="w-4 shrink-0" />
    );

  const content = (
    <span
      className={
        diffLine.lineType === "added"
          ? "bg-green-200/70 dark:bg-green-700/40 text-green-800 dark:text-green-200 rounded px-0.5"
          : diffLine.lineType === "removed"
            ? "bg-red-200/70 dark:bg-red-700/40 text-red-800 dark:text-red-300 line-through rounded px-0.5"
            : ""
      }
    >
      {diffLine.text}
    </span>
  );

  if (lt === "blank") return <div className={`h-2 ${rowBg}`} />;

  const renderContent = () => {
    switch (lt) {
      case "name":
        return <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", fontWeight: 700, fontFamily: "'Times New Roman', Georgia, serif", textAlign: "center", overflowWrap: "anywhere" }}>{content}</p>;
      case "heading":
        return <div style={{ borderBottom: "1.5px solid #111", marginTop: 12, marginBottom: 2, paddingBottom: 2 }}><span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "#111", fontFamily: "sans-serif" }}>{content}</span></div>;
      case "subheading": {
        let titlePart = diffLine.text;
        let datePart = "";
        const dateMatch = diffLine.text.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-–]+(?:\d{4}|Present)(?:[\s\-–]+(?:\d{4}|Present))?\b/i);
        if (dateMatch) {
          datePart = dateMatch[0].trim();
          titlePart = diffLine.text.replace(dateMatch[0], "").trim();
        }
        const pieces = titlePart.split("|");
        return (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 6, marginBottom: 1, gap: 8 }}>
            <p style={{ fontSize: 11, color: "#111", margin: 0 }}>
              <strong>{pieces[0].trim()}</strong>
              {pieces.length > 1 && <span style={{ fontWeight: 400 }}> | {pieces.slice(1).join(" | ").trim()}</span>}
            </p>
            {datePart && <span style={{ fontSize: 10, color: "#333", flexShrink: 0, fontStyle: "italic" }}>{datePart}</span>}
          </div>
        );
      }
      case "bullet":
        return <div style={{ display: "flex", gap: 6, marginLeft: 12, fontSize: 11 }}><span style={{ color: "#111", flexShrink: 0 }}>•</span><span style={{ overflowWrap: "anywhere" }}>{content}</span></div>;
      case "meta":
        return <p style={{ fontSize: 10, color: "#333", textAlign: "center", fontFamily: "sans-serif", overflowWrap: "anywhere" }}>{content}</p>;
      default: {
        if (diffLine.text.includes(":")) {
          const idx = diffLine.text.indexOf(":");
          const label = diffLine.text.slice(0, idx);
          if (label.length < 30) {
            return <p style={{ fontSize: 11, overflowWrap: "anywhere" }}><strong>{label}:</strong><span>{content}</span></p>;
          }
        }
        return <p style={{ fontSize: 11, overflowWrap: "anywhere" }}>{content}</p>;
      }
    }
  };

  return (
    <div className={`flex items-start gap-2 px-4 sm:px-6 py-0.5 ${rowBg} transition-colors`}>
      {gutter}
      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>
    </div>
  );
}

export function DiffViewerTab({ resumeId, pipelineStage }: { resumeId: string | null; pipelineStage: string | null }) {
  const { data, isLoading } = useGetDiff((resumeId as any) ?? "", {
    query: { enabled: !!resumeId, queryKey: getGetDiffQueryKey((resumeId as any) ?? "") },
  });

  if (!resumeId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
        <SplitSquareHorizontal className="w-12 h-12 opacity-30" />
        <p>Upload a resume to see what changed.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
        <p className="text-muted-foreground">Computing differences...</p>
      </div>
    );
  }

  const diffLines = buildDiffLines(data?.originalText || "", data?.rewrittenText || "");
  const additions = diffLines.filter((l) => l.lineType === "added").length;
  const removals = diffLines.filter((l) => l.lineType === "removed").length;
  let firstContentSeen = false;
  const diffReady = ["rewriting", "validating", "complete"].includes(pipelineStage ?? "");

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-purple-400">Diff Viewer</h2>
          <p className="text-muted-foreground mt-1">Changes highlighted within the resume structure.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-green-500/15 text-green-400 border-green-500/30"><Plus className="w-3 h-3 mr-1" />{additions} added</Badge>
          <Badge className="bg-red-500/15 text-red-400 border-red-500/30"><Minus className="w-3 h-3 mr-1" />{removals} removed</Badge>
        </div>
      </div>
      <div className="bg-gray-100 dark:bg-zinc-900 rounded-xl p-3 sm:p-6 lg:p-8">
        <div
          className="w-full max-w-[760px] bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 mx-auto overflow-hidden py-6 sm:py-8"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {diffLines.length === 0 ? (
            <div className="text-center text-gray-400 py-12"><p>{diffReady ? "No visible differences found yet." : "Diff view is waiting for the rewrite stage to finish."}</p></div>
          ) : (
            diffLines.map((diffLine, i) => {
              const isFirst = diffLine.text.trim() && !firstContentSeen ? (firstContentSeen = true, true) : false;
              return <DiffResumeLine key={i} diffLine={diffLine} isFirst={isFirst} />;
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}

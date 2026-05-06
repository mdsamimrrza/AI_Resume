import { useGetDiff, getGetDiffQueryKey } from "@workspace/api-client-react";
import { Loader2, SplitSquareHorizontal, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

type DiffEntry = { type: string; text: string };
type LineType = "name" | "heading" | "subheading" | "bullet" | "meta" | "blank" | "body";

function classifyLine(text: string, isFirst: boolean): LineType {
  const t = text.trim();
  if (!t) return "blank";
  if (isFirst) return "name";
  const allCaps = t === t.toUpperCase() && /[A-Z]/.test(t) && t.length >= 3;
  if (allCaps || t.startsWith("## ") || (t.startsWith("**") && t.endsWith("**"))) return "heading";
  if (t.includes("|")) return "subheading";
  if (t.startsWith("- ") || t.startsWith("* ") || t.startsWith("• ")) return "bullet";
  if (/[@\d()]/.test(t) && t.length < 80) return "meta";
  return "body";
}

interface DiffLine {
  segments: { text: string; type: "added" | "removed" | "equal" }[];
  lineType: "added" | "removed" | "equal" | "mixed";
}

function buildDiffLines(diffs: DiffEntry[]): DiffLine[] {
  const lines: DiffLine[] = [];
  let current: DiffLine["segments"] = [];

  for (const d of diffs) {
    const type = (d.type ?? "equal") as "added" | "removed" | "equal";
    const parts = (d.text || "").split("\n");
    parts.forEach((part, idx) => {
      if (part) current.push({ text: part, type });
      if (idx < parts.length - 1) {
        const hasAdded = current.some((s) => s.type === "added");
        const hasRemoved = current.some((s) => s.type === "removed");
        lines.push({
          segments: current,
          lineType: hasAdded && hasRemoved ? "mixed" : hasAdded ? "added" : hasRemoved ? "removed" : "equal",
        });
        current = [];
      }
    });
  }

  if (current.length) {
    const hasAdded = current.some((s) => s.type === "added");
    const hasRemoved = current.some((s) => s.type === "removed");
    lines.push({
      segments: current,
      lineType: hasAdded && hasRemoved ? "mixed" : hasAdded ? "added" : hasRemoved ? "removed" : "equal",
    });
  }

  return lines;
}

function DiffResumeLine({ diffLine, isFirst }: { diffLine: DiffLine; isFirst: boolean }) {
  const fullText = diffLine.segments.map((s) => s.text).join("");
  const lt = classifyLine(fullText, isFirst);
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

  const InlineSegments = () => (
    <>
      {diffLine.segments.map((seg, i) => (
        <span
          key={i}
          className={
            seg.type === "added"
              ? "bg-green-200/70 dark:bg-green-700/40 text-green-800 dark:text-green-200 rounded px-0.5"
              : seg.type === "removed"
                ? "bg-red-200/70 dark:bg-red-700/40 text-red-800 dark:text-red-300 line-through rounded px-0.5"
                : ""
          }
        >
          {seg.text}
        </span>
      ))}
    </>
  );

  if (lt === "blank") return <div className={`h-2 ${rowBg}`} />;

  return (
    <div className={`flex items-start gap-2 px-3 sm:px-6 py-0.5 ${rowBg} transition-colors`}>
      {gutter}
      <div className="flex-1 min-w-0">
        {lt === "name" && <p style={{ fontSize: "clamp(18px, 4vw, 20px)", fontWeight: 700, fontFamily: "Georgia, serif", letterSpacing: -0.3, overflowWrap: "anywhere" }}><InlineSegments /></p>}
        {lt === "heading" && <div style={{ borderBottom: "2px solid #7c3aed", marginTop: 14, marginBottom: 2, paddingBottom: 2 }}><span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#7c3aed", fontFamily: "sans-serif" }}><InlineSegments /></span></div>}
        {lt === "subheading" && <p style={{ fontSize: 12, fontWeight: 600, fontFamily: "sans-serif", marginTop: 6, overflowWrap: "anywhere" }}><InlineSegments /></p>}
        {lt === "bullet" && <div style={{ display: "flex", gap: 6, marginLeft: 8, fontSize: 11 }}><span style={{ color: "#7c3aed", flexShrink: 0 }}>•</span><span style={{ overflowWrap: "anywhere" }}><InlineSegments /></span></div>}
        {lt === "meta" && <p style={{ fontSize: 10, color: "#666", fontFamily: "sans-serif", overflowWrap: "anywhere" }}><InlineSegments /></p>}
        {lt === "body" && <p style={{ fontSize: 11, overflowWrap: "anywhere" }}><InlineSegments /></p>}
      </div>
    </div>
  );
}

export function DiffViewerTab({ resumeId }: { resumeId: string | null }) {
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

  const diffs = (data?.diffs || []) as DiffEntry[];
  const diffLines = buildDiffLines(diffs);
  const additions = diffLines.filter((l) => l.lineType === "added" || l.lineType === "mixed").length;
  const removals = diffLines.filter((l) => l.lineType === "removed").length;
  let firstContentSeen = false;

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
      <div className="bg-gray-100 dark:bg-zinc-900 rounded-xl p-3 sm:p-6">
        <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
          <div
            className="w-full max-w-[720px] min-w-[280px] sm:min-w-[680px] bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 mx-auto overflow-hidden py-6 sm:py-8"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {diffLines.length === 0 ? (
              <div className="text-center text-gray-400 py-12"><p>No differences found yet. The rewrite may still be processing.</p></div>
            ) : (
              diffLines.map((diffLine, i) => {
                const fullText = diffLine.segments.map((s) => s.text).join("").trim();
                const isFirst = fullText && !firstContentSeen ? (firstContentSeen = true, true) : false;
                return <DiffResumeLine key={i} diffLine={diffLine} isFirst={isFirst} />;
              })
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

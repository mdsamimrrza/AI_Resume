export type LineType = "name" | "heading" | "subheading" | "bullet" | "meta" | "blank" | "body";

export interface ParsedLine {
  type: LineType;
  text: string;
}

const SECTION_HEADINGS = [
  "WORK EXPERIENCE",
  "TECHNICAL SKILLS",
  "POSITIONS OF RESPONSIBILITY",
  "EXPERIENCE",
  "EDUCATION",
  "PROJECTS",
  "CERTIFICATIONS",
  "ACHIEVEMENTS",
  "LEADERSHIP",
  "SUMMARY",
  "SKILLS",
];

const SPLIT_SECTION_HEADINGS = [
  "WORK EXPERIENCE",
  "TECHNICAL SKILLS",
  "POSITIONS OF RESPONSIBILITY",
  "EDUCATION",
  "PROJECTS",
  "CERTIFICATIONS",
  "ACHIEVEMENTS",
  "LEADERSHIP",
  "SUMMARY",
];

const HEADING_PATTERN = SECTION_HEADINGS
  .slice()
  .sort((a, b) => b.length - a.length)
  .map((heading) => heading.replace(/\s+/g, "\\s+"))
  .join("|");

const SPLIT_HEADING_PATTERN = SPLIT_SECTION_HEADINGS
  .slice()
  .sort((a, b) => b.length - a.length)
  .map((heading) => heading.replace(/\s+/g, "\\s+"))
  .join("|");

function cleanupText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/Ã¢â‚¬Â¢|â€¢/g, "•")
    .replace(/Ã¢â‚¬â€|Ã¢â‚¬â€œ|â€”|â€“/g, "-")
    .replace(/[ ]{2,}/g, " ");
}

export function normalizeResumeText(text: string): string {
  const cleaned = cleanupText(text);
  const normalizedLines: string[] = [];

  for (const rawLine of cleaned.split("\n")) {
    let line = rawLine.trim();
    if (!line) {
      normalizedLines.push("");
      continue;
    }

    line = line.replace(/\s*\|\s*$/g, "");
    line = line.replace(new RegExp(`([a-z0-9/])\\s+((?:${SPLIT_HEADING_PATTERN})\\b)`, "g"), "$1\n$2");

    const pieces = line
      .split("\n")
      .flatMap((part) =>
        part
          .split(new RegExp(`(?=\\b(?:${SPLIT_HEADING_PATTERN})\\b)`, "g"))
          .map((item) => item.trim())
          .filter(Boolean),
      );

    for (let piece of pieces) {
      const headingWithContent = piece.match(new RegExp(`^((?:${HEADING_PATTERN}))\\s*:?\\s+(.+)$`, "i"));
      if (headingWithContent) {
        normalizedLines.push(headingWithContent[1].replace(/\s+/g, " ").toUpperCase());
        normalizedLines.push(headingWithContent[2].trim());
        continue;
      }

      const namePhone = piece.match(/^([A-Z][A-Z\s]{5,})\s+(\+?\d[\d\- ]{7,})$/);
      if (namePhone) {
        normalizedLines.push(`${namePhone[1].trim()} | ${namePhone[2].trim()}`);
        continue;
      }

      if (piece.includes("|") && /@|github|linkedin|leetcode|\+?\d/i.test(piece)) {
        for (const part of piece.split("|").map((item) => item.trim()).filter(Boolean)) {
          normalizedLines.push(part);
        }
        continue;
      }

      // Keep standalone generic headings intact instead of splitting them out of longer headings.
      piece = piece.replace(/\bTECHNICAL\s+SKILLS\b/gi, "TECHNICAL SKILLS");
      piece = piece.replace(/\bWORK\s+EXPERIENCE\b/gi, "WORK EXPERIENCE");

      normalizedLines.push(piece);
    }
  }

  return normalizedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function classifyResumeLine(text: string, isFirst: boolean): LineType {
  const t = text.trim();
  if (!t) return "blank";
  if (isFirst) return "name";

  const allCaps = t === t.toUpperCase() && /[A-Z]/.test(t) && t.length >= 3;
  if (allCaps || t.startsWith("## ") || (t.startsWith("**") && t.endsWith("**") && !t.slice(2, -2).includes(" | "))) {
    return "heading";
  }
  if (t.startsWith("- ") || t.startsWith("* ") || t.startsWith("• ")) return "bullet";
  if (t.includes("|")) {
    const pipeCount = (t.match(/\|/g) || []).length;
    if (pipeCount <= 2 && t.length <= 90) {
      return "subheading";
    }
    return "body";
  }
  if (/[@\d()\/\\:+-]/.test(t) && t.length < 100) return "meta";
  return "body";
}

export function parseResume(text: string): ParsedLine[] {
  const normalized = normalizeResumeText(text);
  const rawLines = normalized.split("\n");
  let firstNonEmpty = true;

  return rawLines.map((line) => {
    const t = line.trim();
    if (!t) return { type: "blank", text: "" };
    const parsed = { type: classifyResumeLine(t, firstNonEmpty), text: t };
    if (firstNonEmpty) firstNonEmpty = false;
    return parsed;
  });
}

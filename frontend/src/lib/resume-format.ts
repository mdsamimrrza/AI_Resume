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
    .replace(/Ã¢â‚¬Â¢|â€¢|·/g, "•")
    .replace(/Ã¢â‚¬â€ |Ã¢â‚¬â€œ|â€”|â€“/g, "-")
    .replace(/ (?=[•*] |- )/g, "\n")
    .replace(/[ ]{2,}/g, " ");
}

export function normalizeResumeText(text: string): string {
  let t = text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/Ã¢â‚¬Â¢|â€¢|·/g, "•")
    .replace(/Ã¢â‚¬â€ |Ã¢â‚¬â€œ|â€"|â€"/g, "-");

  // --- PHASE 1: Aggressive pre-splitting of single-blob text ---

  // Split before every known section heading (even mid-sentence)
  const headings = [
    "WORK EXPERIENCE", "TECHNICAL SKILLS", "POSITIONS OF RESPONSIBILITY",
    "EXPERIENCE", "EDUCATION", "PROJECTS", "CERTIFICATIONS",
    "ACHIEVEMENTS", "LEADERSHIP", "SUMMARY", "SKILLS", "INTERNSHIP",
  ];
  for (const h of headings) {
    const escaped = h.replace(/\s+/g, "\\s+");
    t = t.replace(new RegExp(`(?<![\\n])(?=${escaped}\\b)`, "gi"), "\n");
  }

  // Split before bullet markers: ". -", "  -", " • ", " * "
  t = t.replace(/ (?=[•*] |- )/g, "\n");

  // Split contact info chunks: phone, email, github, linkedin, leetcode
  t = t.replace(/([a-z])(\+91|\+\d{1,3}[-\s]?\d)/gi, "$1\n$2");
  t = t.replace(/([^\s|])(\s+[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, "$1\n$2");
  t = t.replace(/([^\s|])\s+((?:github|linkedin|leetcode|twitter)\.[a-z])/gi, "$1\n$2");

  // Split lines that have name+phone jammed together
  t = t.replace(/^([A-Za-z][A-Za-z .,]{5,}?)\s+(\+?\d[\d\-\s]{7,})$/gm, "$1\n$2");

  // Collapse 3+ newlines to 2
  t = t.replace(/\n{3,}/g, "\n\n");

  // --- PHASE 2: Line-by-line normalization ---
  const normalizedLines: string[] = [];

  for (const rawLine of t.split("\n")) {
    let line = rawLine.trim();
    if (!line) {
      normalizedLines.push("");
      continue;
    }

    // Strip trailing pipe
    line = line.replace(/\s*\|\s*$/, "");

    // Pipe-separated contact lines — split into individual items
    if (line.includes("|") && /@|github|linkedin|leetcode|\+?\d/i.test(line)) {
      for (const part of line.split("|").map(p => p.trim()).filter(Boolean)) {
        normalizedLines.push(part);
      }
      continue;
    }

    normalizedLines.push(line);
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

  const parsedLines: ParsedLine[] = [];
  
  for (const line of rawLines) {
    const t = line.trim();
    if (!t) {
      parsedLines.push({ type: "blank", text: "" });
      continue;
    }
    const type = classifyResumeLine(t, firstNonEmpty);
    if (firstNonEmpty) firstNonEmpty = false;
    
    // Group consecutive meta lines into a single line joined by |
    if (type === "meta" && parsedLines.length > 0 && parsedLines[parsedLines.length - 1].type === "meta") {
      parsedLines[parsedLines.length - 1].text += ` | ${t}`;
    } else {
      parsedLines.push({ type, text: t });
    }
  }

  return parsedLines;
}

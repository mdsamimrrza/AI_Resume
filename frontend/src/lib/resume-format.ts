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

// All section headings we recognize (longest first for correct matching)
const ALL_HEADINGS = [
  "WORK EXPERIENCE", "TECHNICAL SKILLS", "POSITIONS OF RESPONSIBILITY",
  "INTERNSHIP EXPERIENCE", "INTERNSHIP", "EXPERIENCE",
  "EDUCATION", "PROJECTS", "CERTIFICATIONS",
  "ACHIEVEMENTS", "LEADERSHIP", "SUMMARY", "SKILLS",
  "KEY SKILLS", "CODING PRACTICE",
].sort((a, b) => b.length - a.length);

// Contact-info keywords used to detect meta lines
const CONTACT_RE = /@|github\.|linkedin\.|leetcode\.|twitter\./i;

export function normalizeResumeText(text: string): string {
  let t = text
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/Ã¢â‚¬Â¢|â€¢|·/g, "•")
    .replace(/Ã¢â‚¬â€ |Ã¢â‚¬â€œ|â€"|â€"/g, "-");

  // ── PHASE 1: inject \n before every section heading found anywhere in the blob ──
  for (const h of ALL_HEADINGS) {
    const escaped = h.replace(/\s+/g, "\\s+");
    t = t.replace(new RegExp(`(?<=[^\\n])(?=\\b${escaped}\\b)`, "gi"), "\n");
  }

  // inject \n before bullet markers — catch ALL forms: '- ', '– ', '• ', '* '
  // regardless of case of following word
  t = t.replace(/([.!?]|\d{4})\s+([-–•*])\s+/g, "$1\n$2 ");
  t = t.replace(/ (?=[•*] |[-–] [a-zA-Z])/g, "\n");

  // split project title line: 'Title | Tech Jan 2024 Built...' -> 'Title | Tech Jan 2024\nBuilt...'
  // detect a date followed immediately by body text
  t = t.replace(/(\b(?:\d{4}|Present)\b)\s+([A-Z])/g, "$1\n$2");

  // inject \n between name and phone: "MD SAMIM REZA +91-..."
  t = t.replace(/^([A-Za-z][A-Za-z .,]{4,}?)\s+(\+?\d[\d\s\-]{7,})$/gm, "$1\n$2");

  // inject \n before phone number attached to preceding text: "...gmail.com(+91..."
  t = t.replace(/([a-z])(\s*\(?\+91|\s*\(?\+\d{1,3}[-\s]?\d)/gi, "$1\n$2");

  // inject \n before email attached to preceding non-space text
  t = t.replace(/([^\s|,])(\s+[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, "$1\n$2");

  // inject \n before URLs attached to preceding text
  t = t.replace(/([^\s|,])\s+((?:github|linkedin|leetcode|twitter)\.[a-zA-Z])/gi, "$1\n$2");

  t = t.replace(/\n{3,}/g, "\n\n");

  // ── PHASE 2: line-by-line — split "HEADING body content" into two lines ──
  const phase2: string[] = [];
  for (const rawLine of t.split("\n")) {
    const line = rawLine.trim();
    if (!line) { phase2.push(""); continue; }

    // Check if line STARTS with a section heading followed by content
    let matched = false;
    for (const h of ALL_HEADINGS) {
      const escaped = h.replace(/\s+/g, "\\s+");
      const m = line.match(new RegExp(`^(${escaped})\\s*:?\\s+(.+)$`, "i"));
      if (m) {
        phase2.push(m[1].toUpperCase());
        phase2.push(m[2].trim());
        matched = true;
        break;
      }
    }
    if (!matched) phase2.push(line);
  }

  // ── PHASE 3: contact pipe-splitting & meta grouping ──
  const final: string[] = [];
  for (const line of phase2) {
    const stripped = line.replace(/\s*\|\s*$/, "");
    if (!stripped) { final.push(""); continue; }

    // Pipe-separated line that contains contact info — split on pipes
    // but only if EVERY pipe-segment is actually a contact item (not a heading)
    if (stripped.includes("|") && CONTACT_RE.test(stripped)) {
      const parts = stripped.split("|").map(p => p.trim()).filter(Boolean);
      // Check if any part is a section heading - if so, push the whole line instead
      const hasHeading = parts.some(p =>
        ALL_HEADINGS.some(h => p.toUpperCase().startsWith(h))
      );
      if (!hasHeading) {
        final.push(...parts);
        continue;
      }
    }

    final.push(stripped);
  }

  return final.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}


export function classifyResumeLine(text: string, isFirst: boolean): LineType {
  const t = text.trim();
  if (!t) return "blank";
  if (isFirst) return "name";

  const allCaps = t === t.toUpperCase() && /[A-Z]/.test(t) && t.length >= 3 && t.length <= 40;
  const isKnownHeading = ALL_HEADINGS.some(h => t.toUpperCase() === h || t.toUpperCase().replace(/\s+/g, " ") === h);
  if (allCaps || isKnownHeading || t.startsWith("## ") || (t.startsWith("**") && t.endsWith("**") && !t.slice(2, -2).includes(" | "))) {
    return "heading";
  }
  if (t.startsWith("- ") || t.startsWith("* ") || t.startsWith("• ") || t.startsWith("– ")) return "bullet";
  if (t.includes("|") || (t.length < 100 && /^[A-Z]/.test(t) && !t.endsWith(".") && /\b\d{4}\b/.test(t))) {
    // A line with pipe or a line that looks like a title with a date
    if (/\b\d{4}\b/.test(t) || /\b(?:Present|current)\b/i.test(t)) return "subheading";
    const pipeCount = (t.match(/\|/g) || []).length;
    if (pipeCount <= 4 && t.length <= 200) return "subheading";
  }
  if (CONTACT_RE.test(t) && t.length < 120) return "meta";
  if (/^\+?\d[\d\s\-()]{7,}$/.test(t)) return "meta"; // standalone phone
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(t)) return "meta"; // standalone email
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
      // Don't push blank yet — check if the last real line was meta.
      // We'll buffer the blank and only add it if next line isn't meta.
      parsedLines.push({ type: "blank", text: "" });
      continue;
    }

    const type = classifyResumeLine(t, firstNonEmpty);
    if (firstNonEmpty) firstNonEmpty = false;

    if (type === "meta") {
      // Find the last non-blank entry
      let lastNonBlank = parsedLines.length - 1;
      while (lastNonBlank >= 0 && parsedLines[lastNonBlank].type === "blank") {
        lastNonBlank--;
      }

      if (lastNonBlank >= 0 && parsedLines[lastNonBlank].type === "meta") {
        // Remove the blank lines between the two meta items
        while (parsedLines.length > lastNonBlank + 1) parsedLines.pop();
        // Append to existing meta line
        parsedLines[lastNonBlank].text += ` | ${t}`;
      } else {
        parsedLines.push({ type, text: t });
      }
    } else {
      parsedLines.push({ type, text: t });
    }
  }

  return parsedLines;
}

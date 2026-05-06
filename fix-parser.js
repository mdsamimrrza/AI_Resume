import fs from 'fs';
const file = 'frontend/src/lib/resume-format.ts';
let code = fs.readFileSync(file, 'utf8');

const replacement = `function cleanupText(text: string): string {
  return text
    .replace(/\\r/g, "")
    .replace(/\\t/g, " ")
    .replace(/Ã¢â‚¬Â¢|â€¢|·/g, "•")
    .replace(/Ã¢â‚¬â€ |Ã¢â‚¬â€œ|â€”|â€“/g, "-")
    .replace(/ (?=[•*] |- )/g, "\\n")
    .replace(/[ ]{2,}/g, " ");
}`;

code = code.replace(/function cleanupText[\s\S]*?\}\n/, replacement + "\n");
fs.writeFileSync(file, code);
console.log('done');

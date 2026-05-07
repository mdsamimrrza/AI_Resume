const t = 'MD SAMIM REZA +91-9036980731 samimrrza1@gmail.com linkedin.com/in/samimrrza github.com/mdsamimrrza EDUCATION Siddaganga Institute of Technology. PROJECTS AI Video Generation Platform React 2024 - Built app. - Developed APIs. TECHNICAL SKILLS Programming Languages: Java, JavaScript';

let s = t;

// Split before section headings
const headings = ['WORK EXPERIENCE','TECHNICAL SKILLS','EXPERIENCE','EDUCATION','PROJECTS','CERTIFICATIONS','SKILLS'];
for (const h of headings) {
  const escaped = h.replace(/\s+/g, '\\s+');
  s = s.replace(new RegExp(`(?<![\\n])(?=${escaped}\\b)`, 'gi'), '\n');
}

// Split before bullets
s = s.replace(/ (?=[•*] |- )/g, '\n');

// Split phone from preceding text
s = s.replace(/([a-z])(\+91|\+\d{1,3}[-\s]?\d)/gi, '$1\n$2');

// Split email from preceding text
s = s.replace(/([^\s|])(\s+[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '$1\n$2');

// Split URLs from preceding text
s = s.replace(/([^\s|])\s+((?:github|linkedin|leetcode|twitter)\.[a-z])/gi, '$1\n$2');

// Split name+phone on same line
s = s.replace(/^([A-Za-z][A-Za-z .,]{5,}?)\s+(\+?\d[\d\-\s]{7,})$/gm, '$1\n$2');

console.log('=== RESULT ===');
console.log(s);

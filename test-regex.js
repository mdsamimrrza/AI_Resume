const text = "AI Video Generation Platform | React, Node.js, Express.js, MongoDB Jan 2024 - Built a full-stack AI video platform to generate videos from text prompts using Replicate and Gemini APIs. - Developed RESTful backend APIs with Node.js and Express.js for validation and video workflows. - Created a responsive React frontend with real-time status updates and MongoDB-based metadata storage.";

const cleaned = text.replace(/ (?=[•*] |- )/g, "\n");
console.log(cleaned);

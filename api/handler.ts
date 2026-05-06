import "dotenv/config";
import app from "../backend/src/app.js";

// MongoDB connection is initialized automatically when @workspace/db is imported
// (it runs connectDB() at module load time with caching for serverless warm invocations)

export default app;

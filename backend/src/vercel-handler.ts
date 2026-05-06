import "dotenv/config";
// Importing @workspace/db triggers the cached MongoDB connection
import app from "./app.js";

export default app;

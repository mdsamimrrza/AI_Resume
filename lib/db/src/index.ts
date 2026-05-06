import mongoose from "mongoose";
import * as schema from "./schema/index.js";

// Global connection state
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is missing in Vercel settings.");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true, // Set to true to allow models to be used before connection
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI!, opts).then((mongooseInstance) => {
      console.log("MongoDB Connected successfully");
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB connection failed:", e);
    throw e;
  }

  return cached.conn;
}

// Do NOT call connectDB() at top level to avoid crashing during Vercel build/initialization
// The models will buffer commands until connectDB is called in the route handler.

export const db = mongoose.connection;
export { connectDB };
export * from "./schema/index.js";

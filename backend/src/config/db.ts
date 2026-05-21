import mongoose from "mongoose";

/**
 * Establishes the Mongoose connection to MongoDB.
 * Retries are handled by Mongoose's internal reconnect logic.
 * Call this once during server boot — never await it inline.
 */
export const connectDB = async (): Promise<void> => {
  const uri = process.env["MONGODB_URI"];

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined in environment variables. " +
        "Copy .env.example to .env and fill in the connection string."
    );
  }

  try {
    console.log("⏳  Connecting to MongoDB...");

    await mongoose.connect(uri, {
      // Mongoose 8 defaults are already sane, but be explicit:
      serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for remote clusters
      socketTimeoutMS: 45000,
    });

    console.log(`✅  MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌  MongoDB connection failed: ${message}`);
    // Re-throw so server.ts can exit gracefully instead of running without DB
    throw error;
  }
};

// ─── Connection Events ────────────────────────────────────────────────────────

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️   MongoDB disconnected — Mongoose will attempt to reconnect");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄  MongoDB reconnected");
});

mongoose.connection.on("error", (err: Error) => {
  console.error(`❌  MongoDB runtime error: ${err.message}`);
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Establishes the Mongoose connection to MongoDB.
 * Retries are handled by Mongoose's internal reconnect logic.
 * Call this once during server boot — never await it inline.
 */
const connectDB = async () => {
    const uri = process.env["MONGODB_URI"];
    if (!uri) {
        throw new Error("MONGODB_URI is not defined in environment variables. " +
            "Copy .env.example to .env and fill in the connection string.");
    }
    try {
        console.log("⏳  Connecting to MongoDB...");
        await mongoose_1.default.connect(uri, {
            // Mongoose 8 defaults are already sane, but be explicit:
            serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for remote clusters
            socketTimeoutMS: 45000,
        });
        console.log(`✅  MongoDB connected: ${mongoose_1.default.connection.host}`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌  MongoDB connection failed: ${message}`);
        // Re-throw so server.ts can exit gracefully instead of running without DB
        throw error;
    }
};
exports.connectDB = connectDB;
// ─── Connection Events ────────────────────────────────────────────────────────
mongoose_1.default.connection.on("disconnected", () => {
    console.warn("⚠️   MongoDB disconnected — Mongoose will attempt to reconnect");
});
mongoose_1.default.connection.on("reconnected", () => {
    console.log("🔄  MongoDB reconnected");
});
mongoose_1.default.connection.on("error", (err) => {
    console.error(`❌  MongoDB runtime error: ${err.message}`);
});
//# sourceMappingURL=db.js.map
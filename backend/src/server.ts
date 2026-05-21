import "dotenv/config";
import http from "http";
import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";

import { connectDB } from "./config/db";
import { globalErrorHandler, notFoundHandler } from "./middleware/error.middleware";
import { initializeSocket } from "./socket/socketHandlers";

import authRoutes from "./routes/auth.routes";
import clientRoutes from "./routes/client.routes";
import providerRoutes from "./routes/provider.routes";
import agentRoutes from "./routes/agent.routes";

// ─── App Configuration ────────────────────────────────────────────────────────

const app: Application = express();
const PORT = parseInt(process.env["PORT"] ?? "3000", 10);
const NODE_ENV = process.env["NODE_ENV"] ?? "development";

// ─── Security Middleware ──────────────────────────────────────────────────────

app.use(
  helmet({
    // Allow cross-origin requests from the Expo dev server
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: true, // Reflect back the requester's origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Debug Logger ─────────────────────────────────────────────────────────────

app.use((req, _res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/provider", providerRoutes);
app.use("/api/agent", agentRoutes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────

// Must be AFTER all routes
app.use(notFoundHandler);

// Must be LAST — Express identifies error handlers by their 4-argument signature
app.use(globalErrorHandler);

// ─── HTTP Server & Socket.io ──────────────────────────────────────────────────

const httpServer = http.createServer(app);

// Attach the Socket.io Presence Engine to the same HTTP server
initializeSocket(httpServer);

// ─── Server Boot ──────────────────────────────────────────────────────────────

const startServer = async (): Promise<void> => {
  try {
    // 1. Connect to MongoDB before accepting traffic
    await connectDB();

    // 2. Start listening
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log("─────────────────────────────────────────");
      console.log(`🚀  Mahir API Server started`);
      console.log(`    Environment : ${NODE_ENV}`);
      console.log(`    Port        : ${PORT}`);
      console.log(`    API Base    : http://0.0.0.0:${PORT}/api`);
      console.log(`    Health      : http://0.0.0.0:${PORT}/health`);
      console.log(`    Socket.io   : ws://0.0.0.0:${PORT}`);
      console.log("─────────────────────────────────────────");
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`💥  Failed to start server: ${message}`);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const shutdown = (signal: string) => {
  console.log(`\n🛑  Received ${signal}. Shutting down gracefully...`);
  httpServer.close(async () => {
    const mongoose = await import("mongoose");
    await mongoose.default.connection.close();
    console.log("✅  MongoDB connection closed. Server shut down.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ─── Unhandled Rejection Guard ────────────────────────────────────────────────

process.on("unhandledRejection", (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.error(`🔴  Unhandled Promise Rejection: ${message}`);
  // In production, exit and let the process manager restart
  if (NODE_ENV === "production") {
    process.exit(1);
  }
});

process.on("uncaughtException", (error: Error) => {
  console.error(`💥  Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// ─── Start ────────────────────────────────────────────────────────────────────

void startServer();

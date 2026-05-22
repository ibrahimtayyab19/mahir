"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const db_1 = require("./config/db");
const error_middleware_1 = require("./middleware/error.middleware");
const socketHandlers_1 = require("./socket/socketHandlers");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const client_routes_1 = __importDefault(require("./routes/client.routes"));
const provider_routes_1 = __importDefault(require("./routes/provider.routes"));
const agent_routes_1 = __importDefault(require("./routes/agent.routes"));
// ─── App Configuration ────────────────────────────────────────────────────────
const app = (0, express_1.default)();
const PORT = parseInt(process.env["PORT"] ?? "3000", 10);
const NODE_ENV = process.env["NODE_ENV"] ?? "development";
// ─── Security Middleware ──────────────────────────────────────────────────────
app.use((0, helmet_1.default)({
    // Allow cross-origin requests from the Expo dev server
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use((0, cors_1.default)({
    origin: true, // Reflect back the requester's origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
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
app.use("/api/auth", auth_routes_1.default);
app.use("/api/client", client_routes_1.default);
app.use("/api/provider", provider_routes_1.default);
app.use("/api/agent", agent_routes_1.default);
// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
// Must be AFTER all routes
app.use(error_middleware_1.notFoundHandler);
// Must be LAST — Express identifies error handlers by their 4-argument signature
app.use(error_middleware_1.globalErrorHandler);
// ─── HTTP Server & Socket.io ──────────────────────────────────────────────────
const httpServer = http_1.default.createServer(app);
// Attach the Socket.io Presence Engine to the same HTTP server
(0, socketHandlers_1.initializeSocket)(httpServer);
// ─── Server Boot ──────────────────────────────────────────────────────────────
const startServer = async () => {
    try {
        // 1. Connect to MongoDB before accepting traffic
        await (0, db_1.connectDB)();
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`💥  Failed to start server: ${message}`);
        process.exit(1);
    }
};
// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
    console.log(`\n🛑  Received ${signal}. Shutting down gracefully...`);
    httpServer.close(async () => {
        const mongoose = await Promise.resolve().then(() => __importStar(require("mongoose")));
        await mongoose.default.connection.close();
        console.log("✅  MongoDB connection closed. Server shut down.");
        process.exit(0);
    });
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
// ─── Unhandled Rejection Guard ────────────────────────────────────────────────
process.on("unhandledRejection", (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    console.error(`🔴  Unhandled Promise Rejection: ${message}`);
    // In production, exit and let the process manager restart
    if (NODE_ENV === "production") {
        process.exit(1);
    }
});
process.on("uncaughtException", (error) => {
    console.error(`💥  Uncaught Exception: ${error.message}`);
    process.exit(1);
});
// ─── Start ────────────────────────────────────────────────────────────────────
void startServer();
//# sourceMappingURL=server.js.map
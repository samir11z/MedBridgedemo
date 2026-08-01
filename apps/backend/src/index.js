require("dotenv").config({ quiet: true });

const app = require("./app");

const PORT = parseInt(process.env.PORT, 10) || 4000;

// Log startup info
console.log("◇ Starting MedBridge API...");
console.log(`◇ NODE_ENV=${process.env.NODE_ENV || "development"}`);
console.log(`◇ DATABASE_URL=${process.env.DATABASE_URL ? (process.env.DATABASE_URL.slice(0, 40) + "...") : "NOT SET"}`);
console.log(`◇ LLM_PROVIDER=${process.env.LLM_PROVIDER || "auto-detect (mock fallback)"}`);

// Initialize AI provider early to show log
try {
  const AIService = require("./services/ai/AIService");
  AIService.getProviderInfo().then(info => {
    console.log(`[AI] Provider ready: ${info.provider} (${info.model}) - supported: ${info.supported?.join(", ")}`);
  }).catch(err => {
    console.warn("[AI] Provider info failed (will use mock):", err.message);
  });
} catch (err) {
  console.warn("[AI] Failed to init AI Service (will use mock):", err.message);
}

const server = app.listen(PORT, () => {
  console.log(`MedBridge API listening on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Keep-alive and error handling to prevent clean exit
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} already in use. Kill existing process: netstat -ano | findstr :${PORT}`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

// Prevent unhandled rejections from crashing silently
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Don't exit immediately, keep server running for debugging
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    process.exit(0);
  });
});

// Prevent nodemon clean exit on Windows - keep event loop alive
setInterval(() => {}, 1000 * 60 * 60);

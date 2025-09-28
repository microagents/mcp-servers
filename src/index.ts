import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createWeatherServer } from "./servers/weather";

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for browser clients
app.use(
  cors({
    origin: "*", // Configure appropriately for production
    exposedHeaders: ["Mcp-Session-Id"],
    allowedHeaders: ["Content-Type", "mcp-session-id"],
  }),
);

app.use(express.json());

// Factory function to create MCP servers
const createMcpServer = (serverType: string): McpServer => {
  switch (serverType) {
    case "weather":
      return createWeatherServer();
    default:
      throw new Error(`Unknown server type: ${serverType}`);
  }
};

// Generic stateless MCP endpoint handler
const createStatelessMcpEndpoint = (serverType: string) => {
  // Handle POST requests - create new server/transport for each request
  const handlePost = async (req: express.Request, res: express.Response) => {
    try {
      // Create new instances for complete isolation
      const server = createMcpServer(serverType);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // Stateless mode
      });

      // Clean up on request close
      res.on("close", () => {
        try {
          transport.close();
          server.close();
        } catch (error) {
          console.error("Error closing transport/server:", error);
        }
      });

      // Connect server to transport
      await server.connect(transport);

      // Handle the request
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error(`Error handling POST request:`, error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  };

  // GET and DELETE not supported in stateless mode
  const handleUnsupportedMethod = async (
    _req: express.Request,
    res: express.Response,
  ) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message:
          "Method not allowed. Only POST requests are supported in stateless mode.",
      },
      id: null,
    });
  };

  return { handlePost, handleUnsupportedMethod };
};

// Create weather MCP endpoint
const weatherEndpoint = createStatelessMcpEndpoint("weather");

// Weather MCP server routes
app.post("/weather", weatherEndpoint.handlePost);
app.get("/weather", weatherEndpoint.handleUnsupportedMethod);
app.delete("/weather", weatherEndpoint.handleUnsupportedMethod);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    mode: "stateless",
    uptime: process.uptime(),
  });
});

// Root endpoint with API information
app.get("/", (_req, res) => {
  res.json({
    name: "Express MCP Gateway",
    version: "1.0.0",
    description:
      "Stateless Express server serving MCP (http-streamable) servers",
    mode: "stateless",
    endpoints: {
      weather: {
        path: "/weather",
        description: "Weather data MCP server with current conditions lookup",
        methods: ["POST"],
        note: "Only POST requests supported in stateless mode",
      },
    },
    health: "/health",
    protocol: "Model Context Protocol (MCP) - Streamable HTTP (Stateless)",
    documentation: "https://modelcontextprotocol.io",
  });
});

// 404 handler - middleware for unmatched routes
app.use((_req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: ["/", "/health", "POST /weather"],
  });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Something went wrong",
      });
    }
  },
);

// Start the server
const server = app.listen(PORT, () => {
  console.log(
    `🚀 Express MCP Gateway listening on port ${PORT} (Stateless Mode)`,
  );
  console.log(`📡 Available MCP servers:`);
  console.log(`   - Weather: POST http://localhost:${PORT}/weather`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API info: http://localhost:${PORT}/`);
  console.log(
    `ℹ️  Note: Running in stateless mode - no sessions or SSE support`,
  );
});

// Graceful shutdown handling
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT (Ctrl+C), shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed successfully");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed successfully");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  server.close(() => {
    process.exit(1);
  });
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  server.close(() => {
    process.exit(1);
  });
});

export default app;

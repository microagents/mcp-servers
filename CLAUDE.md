# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo containing an Express-based MCP (Model Context Protocol) Gateway that serves multiple MCP servers through HTTP-streamable endpoints. The gateway implements a stateless architecture where each HTTP request creates fresh MCP server instances, ensuring complete isolation between requests.

## Quick Reference

### Key Files
- **Main Application**: `src/index.ts` - Express server with MCP endpoint routing
- **Weather Server**: `src/servers/weather.ts` - MCP server implementation for weather data
- **Build Config**: `tsconfig.json` - TypeScript configuration with strict settings
- **Package Config**: `package.json` - Dependencies and npm scripts

### Development Workflow
1. **Development**: `npm run dev` - Start with tsx for hot reload
2. **Build**: `npm run build` - Compile TypeScript to dist/ directory
3. **Start**: `npm start` - Run compiled JavaScript from dist/
4. **Watch**: `npm run watch` - Development with file watching
5. **Lint**: `npm run lint` - Run ESLint on source files
6. **Test**: `npm test` - Run Jest tests

## Architecture

### Gateway Architecture (`src/`)

**Main Application (`src/index.ts`)**:
- Express 5.1.0 server running on configurable port (default: 3000)
- Stateless MCP endpoint handler - creates new server instances per request
- CORS enabled for browser clients with MCP-specific headers
- Automatic cleanup of server instances on request completion
- Health check endpoint at `/health`
- API information endpoint at `/`

**Core Components**:
- `createMcpServer()` - Factory function for creating MCP server instances
- `createStatelessMcpEndpoint()` - Generic handler for stateless MCP endpoints
- Error handling with proper JSON-RPC 2.0 error responses
- Graceful shutdown with SIGINT/SIGTERM handling

**MCP Server Implementation (`src/servers/weather.ts`)**:
- Weather server using Open-Meteo API (free, no API key required)
- Two tools: `get_weather` (coordinates) and `get_weather_by_city` (city name)
- Comprehensive weather data: current conditions, hourly forecast, daily forecast
- Geocoding integration for city name resolution
- Error handling with structured response format
- Weather code to description mapping

### State Management
- **Stateless Architecture**: Each HTTP request creates independent MCP server instances
- **Request Isolation**: Server instances are automatically cleaned up after request completion
- **No Sessions**: Only POST requests supported, no session management or SSE

### API Endpoints
- `POST /mcp/weather` - Weather MCP server endpoint
- `GET /health` - Health check with system status
- `GET /` - API information and available endpoints
- Error handling for 404 and 500 errors

## Development Commands

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Development with file watching
npm run watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test
```

## Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

### CORS Configuration
- Development: Allows all origins (`*`)
- Production: Should be configured with specific allowed origins

### MCP Protocol
- Uses Model Context Protocol SDK version 1.18.2
- Implements HTTP-streamable transport in stateless mode
- JSON-RPC 2.0 compliant responses
- Only POST requests supported (no GET/DELETE in stateless mode)

## Code Patterns

### MCP Server Creation Pattern
```typescript
export function createWeatherServer(): McpServer {
  const server = new McpServer({
    name: "weather-server",
    version: "1.0.0",
  });

  // Register tools with zod schemas
  server.registerTool("tool_name", schema, async (params) => {
    // Implementation
  });

  return server;
}
```

### Stateless Endpoint Pattern
```typescript
const createStatelessMcpEndpoint = (serverType: string) => {
  const handlePost = async (req, res) => {
    // Create fresh instances per request
    const server = createMcpServer(serverType);
    const transport = new StreamableHTTPServerTransport();

    // Auto-cleanup on request completion
    res.on("close", () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  };

  return { handlePost, handleUnsupportedMethod };
};
```

### Error Handling Pattern
- Proper JSON-RPC 2.0 error responses
- Structured error information with context
- Graceful degradation for external API failures
- Automatic cleanup of resources on errors

## External Dependencies

### Core Dependencies
- **Express 5.1.0**: Web server framework
- **@modelcontextprotocol/sdk 1.18.2**: MCP protocol implementation
- **Zod 3.25.76**: Runtime type validation
- **TypeScript 5.9.2**: Type safety and compilation

### Development Dependencies
- **tsx 4.20.6**: TypeScript execution and hot reload
- **ESLint**: Code linting with TypeScript support
- **Jest 30.2.0**: Testing framework

### External APIs
- **Open-Meteo API**: Weather data (free, no authentication)
- **Open-Meteo Geocoding API**: Location resolution

## Implementation Notes

### Adding New MCP Servers
1. Create new server file in `src/servers/`
2. Follow the `createServer()` pattern with proper tool registration
3. Add server type to `createMcpServer()` factory in `src/index.ts`
4. Add new endpoint routes following the weather server pattern
5. Update API information endpoint with new server details

### Error Handling Best Practices
- Always return proper JSON-RPC 2.0 error responses
- Include contextual information in error responses
- Ensure proper resource cleanup in all error scenarios
- Handle external API failures gracefully

### Performance Considerations
- Stateless architecture prevents memory leaks between requests
- Automatic cleanup ensures no lingering connections
- Consider rate limiting for production deployments
- Monitor external API usage and response times

### Security Considerations
- Configure CORS appropriately for production environments
- Consider adding authentication/authorization for production
- Validate all input parameters using Zod schemas
- Sanitize external API responses before processing

## Testing

The project includes Jest configuration for testing. Test files should be placed alongside source files with `.test.ts` extension and will be automatically excluded from TypeScript compilation.

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### Test Patterns
- Mock external API calls (Open-Meteo)
- Test error scenarios and edge cases
- Verify proper JSON-RPC 2.0 compliance
- Test stateless behavior (no shared state between requests)
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  CallToolResult,
  TextContent,
  ImageContent,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import puppeteer, { Browser, Page } from "puppeteer";
import { AVAILABLE_TOOLS } from "./definitions/tools.js";
// Global state
let browser: Browser | undefined;
let page: Page | undefined;
const consoleLogs: string[] = [];
const screenshots = new Map<string, string>();

declare global {
    interface Window {
      mcpHelper: {
        logs: string[],
        originalConsole: Partial<typeof console>,
      }
    }
  }
  
const createServer = () => {
    async function ensureBrowser() {
        if (!browser) {
          const npx_args = { headless: false }
          const docker_args = { headless: true, args: ["--no-sandbox", "--single-process", "--no-zygote"] }
          browser = await puppeteer.launch(process.env.DOCKER_CONTAINER ? docker_args : npx_args);
          const pages = await browser.pages();
          page = pages[0];
      
          page.on("console", (msg) => {
            const logEntry = `[${msg.type()}] ${msg.text()}`;
            consoleLogs.push(logEntry);
            server.notification({
              method: "notifications/resources/updated",
              params: { uri: "console://logs" },
            });
          });
        }
        return page!;
      }

    async function handleToolCall(name: string, args: any): Promise<CallToolResult> {
        const page = await ensureBrowser();
      
        switch (name) {
          case "puppeteer_navigate":
            await page.goto(args.url);
            return {
              content: [{
                type: "text",
                text: `Navigated to ${args.url}`,
              }],
              isError: false,
            };
      
          case "puppeteer_screenshot": {
            const width = args.width ?? 800;
            const height = args.height ?? 600;
            await page.setViewport({ width, height });
      
            const screenshot = await (args.selector ?
              (await page.$(args.selector))?.screenshot({ encoding: "base64" }) :
              page.screenshot({ encoding: "base64", fullPage: false }));
      
            if (!screenshot) {
              return {
                content: [{
                  type: "text",
                  text: args.selector ? `Element not found: ${args.selector}` : "Screenshot failed",
                }],
                isError: true,
              };
            }
      
            screenshots.set(args.name, screenshot as string);
            server.notification({
              method: "notifications/resources/list_changed",
            });
      
            return {
              content: [
                {
                  type: "text",
                  text: `Screenshot '${args.name}' taken at ${width}x${height}`,
                } as TextContent,
                {
                  type: "image",
                  data: screenshot,
                  mimeType: "image/png",
                } as ImageContent,
              ],
              isError: false,
            };
          }
      
          case "puppeteer_click":
            try {
              await page.click(args.selector);
              return {
                content: [{
                  type: "text",
                  text: `Clicked: ${args.selector}`,
                }],
                isError: false,
              };
            } catch (error) {
              return {
                content: [{
                  type: "text",
                  text: `Failed to click ${args.selector}: ${(error as Error).message}`,
                }],
                isError: true,
              };
            }
      
          case "puppeteer_fill":
            try {
              await page.waitForSelector(args.selector);
              await page.type(args.selector, args.value);
              return {
                content: [{
                  type: "text",
                  text: `Filled ${args.selector} with: ${args.value}`,
                }],
                isError: false,
              };
            } catch (error) {
              return {
                content: [{
                  type: "text",
                  text: `Failed to fill ${args.selector}: ${(error as Error).message}`,
                }],
                isError: true,
              };
            }
      
          case "puppeteer_select":
            try {
              await page.waitForSelector(args.selector);
              await page.select(args.selector, args.value);
              return {
                content: [{
                  type: "text",
                  text: `Selected ${args.selector} with: ${args.value}`,
                }],
                isError: false,
              };
            } catch (error) {
              return {
                content: [{
                  type: "text",
                  text: `Failed to select ${args.selector}: ${(error as Error).message}`,
                }],
                isError: true,
              };
            }
      
          case "puppeteer_hover":
            try {
              await page.waitForSelector(args.selector);
              await page.hover(args.selector);
              return {
                content: [{
                  type: "text",
                  text: `Hovered ${args.selector}`,
                }],
                isError: false,
              };
            } catch (error) {
              return {
                content: [{
                  type: "text",
                  text: `Failed to hover ${args.selector}: ${(error as Error).message}`,
                }],
                isError: true,
              };
            }
      
          case "puppeteer_evaluate":
            try {
              await page.evaluate(() => {
                window.mcpHelper = {
                  logs: [],
                  originalConsole: { ...console },
                };
      
                ['log', 'info', 'warn', 'error'].forEach(method => {
                  (console as any)[method] = (...args: any[]) => {
                    window.mcpHelper.logs.push(`[${method}] ${args.join(' ')}`);
                    (window.mcpHelper.originalConsole as any)[method](...args);
                  };
                } );
              } );
      
              const result = await page.evaluate( args.script );
      
              const logs = await page.evaluate(() => {
                Object.assign(console, window.mcpHelper.originalConsole);
                const logs = window.mcpHelper.logs;
                delete ( window as any).mcpHelper;
                return logs;
              });
      
              return {
                content: [
                  {
                    type: "text",
                    text: `Execution result:\n${JSON.stringify(result, null, 2)}\n\nConsole output:\n${logs.join('\n')}`,
                  },
                ],
                isError: false,
              };
            } catch (error) {
              return {
                content: [{
                  type: "text",
                  text: `Script execution failed: ${(error as Error).message}`,
                }],
                isError: true,
              };
            }
      
          default:
            return {
              content: [{
                type: "text",
                text: `Unknown tool: ${name}`,
              }],
              isError: true,
            };
        }
      }

    const server = new Server(
        {
          name: "example-servers/puppeteer",
          version: "0.1.0",
        },
        {
          capabilities: {
            resources: {},
            tools: {},
          },
        },
      );
      
      
      // Setup request handlers
      server.setRequestHandler(ListResourcesRequestSchema, async () => ({
        resources: [
          {
            uri: "console://logs",
            mimeType: "text/plain",
            name: "Browser console logs",
          },
          ...Array.from(screenshots.keys()).map(name => ({
            uri: `screenshot://${name}`,
            mimeType: "image/png",
            name: `Screenshot: ${name}`,
          })),
        ],
      }));
      
      server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const uri = request.params.uri.toString();
      
        if (uri === "console://logs") {
          return {
            contents: [{
              uri,
              mimeType: "text/plain",
              text: consoleLogs.join("\n"),
            }],
          };
        }
      
        if (uri.startsWith("screenshot://")) {
          const name = uri.split("://")[1];
          const screenshot = screenshots.get(name);
          if (screenshot) {
            return {
              contents: [{
                uri,
                mimeType: "image/png",
                blob: screenshot,
              }],
            };
          }
        }
      
        throw new Error(`Resource not found: ${uri}`);
      });
      
      server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: AVAILABLE_TOOLS,
      }));
      
      server.setRequestHandler(CallToolRequestSchema, async (request) =>
        handleToolCall(request.params.name, request.params.arguments ?? {})
      );

      return server;
};

export async function runServer() {
    const server = createServer();

    process.stdin.on("close", () => {
        console.error("Puppeteer MCP Server closed");
        server.close();
      });
      
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
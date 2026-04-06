#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createServer as createMcpServer } from './externalPhenotypePipelineMcp.js';

const DEFAULT_HOST = process.env.MCP_HOST || '127.0.0.1';
const DEFAULT_PORT = Number(process.env.MCP_PORT || 8787);
const DEFAULT_PATH = process.env.MCP_PATH || '/mcp';

function usage() {
  return [
    'Usage:',
    '  node src/scripts/externalPhenotypePipelineHttpMcp.js',
    '  MCP_HOST=127.0.0.1 MCP_PORT=8787 MCP_PATH=/mcp node src/scripts/externalPhenotypePipelineHttpMcp.js',
    '',
    'Default URL:',
    `  http://${DEFAULT_HOST}:${DEFAULT_PORT}${DEFAULT_PATH}`
  ].join('\n');
}

function buildBadRequest(res, message) {
  return res.status(400).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message
    },
    id: null
  });
}

async function main() {
  if (process.argv.includes('--help')) {
    console.log(usage());
    process.exit(0);
  }

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const transports = new Map();

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      transport: 'streamable-http',
      mcp_path: DEFAULT_PATH,
      url: `http://${DEFAULT_HOST}:${DEFAULT_PORT}${DEFAULT_PATH}`
    });
  });

  app.post(DEFAULT_PATH, async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];

    try {
      let transport = sessionId ? transports.get(String(sessionId)) : null;

      if (!transport) {
        if (sessionId) {
          return buildBadRequest(res, 'Bad Request: Invalid session ID provided');
        }

        if (!isInitializeRequest(req.body)) {
          return buildBadRequest(res, 'Bad Request: No valid session ID provided');
        }

        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (initializedSessionId) => {
            transports.set(initializedSessionId, transport);
          }
        });

        transport.onclose = () => {
          const closedSessionId = transport.sessionId;
          if (closedSessionId) {
            transports.delete(closedSessionId);
          }
        };

        const server = await createMcpServer();
        await server.connect(transport);
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('Error handling MCP POST request:', error?.stack || error?.message || String(error));
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: null
        });
      }
    }
  });

  app.get(DEFAULT_PATH, async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    const transport = sessionId ? transports.get(String(sessionId)) : null;

    if (!sessionId || !transport) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    await transport.handleRequest(req, res);
  });

  app.delete(DEFAULT_PATH, async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    const transport = sessionId ? transports.get(String(sessionId)) : null;

    if (!sessionId || !transport) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    try {
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('Error handling MCP DELETE request:', error?.stack || error?.message || String(error));
      if (!res.headersSent) {
        res.status(500).send('Internal server error');
      }
    }
  });

  app.listen(DEFAULT_PORT, DEFAULT_HOST, () => {
    console.error(
      `Genovy external phenotype pipeline MCP HTTP server listening at http://${DEFAULT_HOST}:${DEFAULT_PORT}${DEFAULT_PATH}`
    );
  });
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});

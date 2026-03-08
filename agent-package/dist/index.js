#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
const server = new Server({
    name: "duplicate-issues-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
const API_URL = process.env.API_URL || "http://localhost:3001";
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "search_duplicate_issues",
                description: "Search for duplicate issues in a repository using semantic search",
                inputSchema: {
                    type: "object",
                    properties: {
                        repo: { type: "string", description: "Repository name (e.g., owner/repo)" },
                        query: { type: "string", description: "Search query to find duplicates for" }
                    },
                    required: ["repo", "query"]
                }
            },
            {
                name: "close_duplicate_issue",
                description: "Close an issue as a duplicate of another issue using GitHub CLI",
                inputSchema: {
                    type: "object",
                    properties: {
                        repo: { type: "string", description: "Repository name (e.g., owner/repo)" },
                        issue_number: { type: "number", description: "The issue number to close" },
                        duplicate_of_number: { type: "number", description: "The issue number it is a duplicate of" }
                    },
                    required: ["repo", "issue_number", "duplicate_of_number"]
                }
            },
            {
                name: "scan_repo_duplicates",
                description: "Scan a repository for duplicate issues",
                inputSchema: {
                    type: "object",
                    properties: {
                        repo: { type: "string", description: "Repository name (e.g., owner/repo)" }
                    },
                    required: ["repo"]
                }
            }
        ]
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "search_duplicate_issues") {
        const { repo, query } = request.params.arguments;
        try {
            const response = await fetch(`${API_URL}/api/search-repo`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repo, query })
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Error searching issues: ${error.message}` }],
                isError: true
            };
        }
    }
    if (request.params.name === "scan_repo_duplicates") {
        const { repo } = request.params.arguments;
        try {
            const response = await fetch(`${API_URL}/api/scan-duplicates`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repoFullName: repo })
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Error scanning repository: ${error.message}` }],
                isError: true
            };
        }
    }
    if (request.params.name === "close_duplicate_issue") {
        const { repo, issue_number, duplicate_of_number } = request.params.arguments;
        try {
            const cmd = `gh issue close ${issue_number} -R ${repo} -c "Closed as duplicate of #${duplicate_of_number}"`;
            const { stdout, stderr } = await execAsync(cmd);
            if (stderr) {
                console.error(`gh cli stderr: ${stderr}`);
            }
            return {
                content: [{ type: "text", text: `Successfully closed issue #${issue_number} as duplicate of #${duplicate_of_number}.\nOutput: ${stdout}` }]
            };
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Error closing issue: ${error.message}` }],
                isError: true
            };
        }
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
});
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Duplicate Issues MCP Server running on stdio");
}
run().catch(console.error);

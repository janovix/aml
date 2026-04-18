/**
 * Minimal JSON-RPC 2.0 MCP-style surface for Janbot tools (Bearer JWT).
 *
 * Methods:
 * - `tools/list` — tool names + descriptions
 * - `tools/call` — `{ name, arguments }` executes server-side tool handler
 */

import { buildJanbotTools, filterToolsByJanbotFlags } from "@/lib/ai";

export const runtime = "nodejs";

interface JsonRpcRequest {
	jsonrpc?: string;
	id?: string | number | null;
	method?: string;
	params?: unknown;
}

function extractJwt(request: Request): string | null {
	const authHeader = request.headers.get("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return null;
	}
	return authHeader.slice(7);
}

function json(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function getOrganizationIdFromBody(body: unknown): string | undefined {
	if (!body || typeof body !== "object") return undefined;
	const o = body as { organizationId?: string };
	return typeof o.organizationId === "string" ? o.organizationId : undefined;
}

/** MCP must not expose HITL-gated tools (no approval UI on this channel). */
function isMcpCallableTool(
	def: unknown,
): def is {
	needsApproval?: boolean;
	execute: (input: unknown) => Promise<unknown>;
} {
	if (!def || typeof def !== "object") return false;
	const d = def as { needsApproval?: boolean; execute?: unknown };
	if (d.needsApproval) return false;
	return typeof d.execute === "function";
}

export async function POST(request: Request) {
	const jwt = extractJwt(request);
	if (!jwt) {
		return json(
			{
				jsonrpc: "2.0",
				id: null,
				error: { code: 401, message: "Bearer token required" },
			},
			401,
		);
	}

	let req: JsonRpcRequest;
	try {
		req = (await request.json()) as JsonRpcRequest;
	} catch {
		return json(
			{
				jsonrpc: "2.0",
				id: null,
				error: { code: -32700, message: "Parse error" },
			},
			400,
		);
	}

	const id = req.id ?? null;
	const method = req.method;

	if (method === "tools/list") {
		const organizationId = getOrganizationIdFromBody(req.params);
		const tools = await filterToolsByJanbotFlags(
			buildJanbotTools({ jwt, organizationId }),
			jwt,
			organizationId,
		);
		const list = Object.entries(tools)
			.filter(([, def]) => isMcpCallableTool(def))
			.map(([name, def]) => ({
				name,
				description:
					def &&
					typeof (def as { description?: string }).description === "string"
						? (def as { description: string }).description
						: "",
			}));
		return json({ jsonrpc: "2.0", id, result: { tools: list } });
	}

	if (method === "tools/call") {
		const params = (req.params ?? {}) as {
			name?: string;
			arguments?: Record<string, unknown>;
			organizationId?: string;
		};
		const name = params.name;
		if (!name) {
			return json(
				{
					jsonrpc: "2.0",
					id,
					error: { code: -32602, message: "params.name is required" },
				},
				400,
			);
		}

		const organizationId = params.organizationId;
		const tools = (await filterToolsByJanbotFlags(
			buildJanbotTools({ jwt, organizationId }),
			jwt,
			organizationId,
		)) as Record<string, { execute?: (input: unknown) => Promise<unknown> }>;
		const tool = tools[name];
		if (!isMcpCallableTool(tool)) {
			return json(
				{
					jsonrpc: "2.0",
					id,
					error: { code: -32601, message: `Unknown or disabled tool: ${name}` },
				},
				404,
			);
		}

		try {
			const out = await tool.execute(params.arguments ?? {});
			return json({
				jsonrpc: "2.0",
				id,
				result: {
					content: [{ type: "text", text: JSON.stringify(out) }],
				},
			});
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Tool execution failed";
			return json(
				{
					jsonrpc: "2.0",
					id,
					error: { code: -32000, message: msg },
				},
				500,
			);
		}
	}

	return json(
		{
			jsonrpc: "2.0",
			id,
			error: { code: -32601, message: "Method not found" },
		},
		400,
	);
}

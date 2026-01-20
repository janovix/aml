/**
 * AI Chat API Route
 *
 * Handles streaming chat completions using Vercel AI SDK.
 * Supports multiple LLM providers (OpenAI, Anthropic, Google).
 * Includes tools for querying user data from aml-svc.
 */

import { streamText, stepCountIs } from "ai";
import {
	getModel,
	SYSTEM_PROMPT,
	createDataTools,
	createImportTool,
	type LlmModel,
	DEFAULT_MODEL,
	MODEL_CONFIGS,
} from "@/lib/ai";

// Define the request body type
interface FileUpload {
	fileName: string;
	entityType: "CLIENT" | "TRANSACTION";
	fileContent: string; // Base64 encoded
}

interface ChatRequestBody {
	messages: Array<{
		role: "user" | "assistant" | "system";
		content: string;
	}>;
	model?: LlmModel;
	orgSlug?: string;
	fileUpload?: FileUpload;
}

/**
 * Extract JWT from Authorization header
 */
function extractJwt(request: Request): string | null {
	const authHeader = request.headers.get("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return null;
	}
	return authHeader.slice(7);
}

/**
 * POST /api/chat
 *
 * Handles chat messages and streams responses.
 * Requires authentication to access user data via tools.
 */
export async function POST(request: Request) {
	try {
		// Extract JWT for authenticated API calls
		const jwt = extractJwt(request);

		// Parse request body
		const body: ChatRequestBody = await request.json();
		const { messages, model: requestedModel, orgSlug, fileUpload } = body;

		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			return new Response(
				JSON.stringify({ error: "Messages array is required" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Determine which model to use
		const modelId: LlmModel =
			requestedModel && MODEL_CONFIGS[requestedModel]
				? requestedModel
				: DEFAULT_MODEL;

		// Get the model instance
		const model = getModel({ model: modelId });

		// Create tools with JWT for authenticated API calls
		// If no JWT, tools will fail gracefully with auth errors
		const dataTools = jwt ? createDataTools(jwt) : {};

		// If there's a file upload, add the import tool
		const importTool =
			fileUpload && jwt ? createImportTool(jwt, fileUpload, orgSlug) : {};

		// Combine all tools
		const tools = { ...dataTools, ...importTool };
		const hasTools = Object.keys(tools).length > 0;

		// Build system prompt with file context if present
		let systemPrompt = SYSTEM_PROMPT;
		if (fileUpload) {
			systemPrompt += `\n\n## Current File Upload
A user has uploaded a file for import:
- **File name**: ${fileUpload.fileName}
- **Type**: ${fileUpload.entityType === "CLIENT" ? "Clients (KYC data)" : "Transactions"}

You have access to the \`processImport\` tool to process this file. When the user asks to import or doesn't provide additional instructions, use the tool to process the file immediately.`;
		}

		// Create the streaming response with tools
		// stopWhen: stepCountIs(5) allows up to 5 steps for tool execution and response
		const result = streamText({
			model,
			system: systemPrompt,
			messages,
			tools: hasTools ? tools : undefined,
			stopWhen: hasTools ? stepCountIs(5) : undefined,
		});

		// Return the streaming response
		return result.toTextStreamResponse();
	} catch (error) {
		console.error("Chat API error:", error);

		// Handle specific error types
		if (error instanceof SyntaxError) {
			return new Response(
				JSON.stringify({ error: "Invalid JSON in request body" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Check for missing API key errors
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		if (
			errorMessage.includes("API key") ||
			errorMessage.includes("apiKey") ||
			errorMessage.includes("OPENAI_API_KEY") ||
			errorMessage.includes("ANTHROPIC_API_KEY") ||
			errorMessage.includes("GOOGLE_GENERATIVE_AI_API_KEY")
		) {
			return new Response(
				JSON.stringify({
					error: "AI provider not configured. Please contact support.",
				}),
				{ status: 503, headers: { "Content-Type": "application/json" } },
			);
		}

		return new Response(
			JSON.stringify({ error: "Failed to process chat request" }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
}

/**
 * GET /api/chat
 *
 * Returns available models and configuration
 */
export async function GET() {
	const models = Object.entries(MODEL_CONFIGS).map(([id, config]) => ({
		id,
		...config,
		available: true, // In production, check if provider API key is set
	}));

	return new Response(
		JSON.stringify({
			models,
			defaultModel: DEFAULT_MODEL,
		}),
		{
			status: 200,
			headers: { "Content-Type": "application/json" },
		},
	);
}

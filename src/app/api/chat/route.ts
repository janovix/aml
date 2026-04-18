/**
 * AI Chat API Route
 *
 * UIMessage streaming (Vercel AI SDK v6) with tools for aml-svc + guardrails + persistence.
 */

import { cookies } from "next/headers";
import {
	streamText,
	stepCountIs,
	hasToolCall,
	convertToModelMessages,
	type UIMessage,
} from "ai";
import * as Sentry from "@sentry/nextjs";
import {
	getModel,
	buildJanbotSystemPrompt,
	buildJanbotTools,
	filterToolsByJanbotFlags,
	type LlmModel,
	DEFAULT_MODEL,
	MODEL_CONFIGS,
	type FileUploadContext,
} from "@/lib/ai";
import { getAmlCoreBaseUrl } from "@/lib/api/config";
import { getAuthServiceUrl } from "@/lib/auth/config";
import { scanUserTextForInjection } from "@/lib/ai/guardrails/injection";
import { classifyJanbotIntent } from "@/lib/ai/guardrails/intent";
import { JANBOT_MAX_OUTPUT_TOKENS } from "@/lib/ai/guardrails/budget";

export const runtime = "nodejs";

interface ChatRequestBody {
	id?: string;
	messages: UIMessage[];
	model?: LlmModel;
	orgSlug?: string;
	organizationId?: string;
	fileUpload?: FileUploadContext;
	threadId?: string;
	trigger?: string;
	messageId?: string;
}

function extractJwt(request: Request): string | null {
	const authHeader = request.headers.get("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return null;
	}
	return authHeader.slice(7);
}

function isUIMessageArray(value: unknown): value is UIMessage[] {
	return Array.isArray(value) && value.every((m) => m && typeof m === "object");
}

function collectLatestUserText(messages: UIMessage[]): string {
	for (let i = messages.length - 1; i >= 0; i--) {
		const m = messages[i];
		if (m.role !== "user") continue;
		const parts = m.parts ?? [];
		const text = parts
			.filter(
				(p): p is { type: "text"; text: string } =>
					p.type === "text" &&
					"text" in p &&
					typeof (p as { text?: string }).text === "string",
			)
			.map((p) => p.text)
			.join("\n\n");
		if (text.trim()) return text;
	}
	return "";
}

async function persistThreadMessage(args: {
	jwt: string;
	threadId: string;
	role: "user" | "assistant" | "system";
	parts: unknown[];
	model?: LlmModel;
	metadata?: unknown;
	id?: string;
}): Promise<void> {
	const base = getAmlCoreBaseUrl();
	const url = new URL(
		`/api/v1/chat/threads/${encodeURIComponent(args.threadId)}/messages`,
		base,
	);
	const res = await fetch(url.toString(), {
		method: "POST",
		headers: {
			Authorization: `Bearer ${args.jwt}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			id: args.id,
			role: args.role,
			parts: args.parts,
			model: args.model,
			metadata: args.metadata,
		}),
	});
	if (!res.ok) {
		const t = await res.text().catch(() => "");
		console.warn("Janbot persist message failed:", res.status, t);
	}
}

async function logAbuseEvent(args: {
	jwt: string;
	threadId?: string;
	kind: string;
	snippet?: string;
}): Promise<void> {
	try {
		const base = getAmlCoreBaseUrl();
		const url = new URL("/api/v1/chat/abuse-events", base);
		await fetch(url.toString(), {
			method: "POST",
			headers: {
				Authorization: `Bearer ${args.jwt}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				kind: args.kind,
				snippet: args.snippet,
				threadId: args.threadId,
			}),
		});
	} catch (e) {
		console.warn("Janbot abuse log failed:", e);
	}
}

async function reportUsageToAuthFromServer(usage: {
	inputTokens?: number;
	outputTokens?: number;
	totalTokens?: number;
}): Promise<void> {
	try {
		const baseUrl = getAuthServiceUrl();
		const cookieStore = await cookies();
		const cookieHeader = cookieStore
			.getAll()
			.map((c) => `${c.name}=${c.value}`)
			.join("; ");
		if (!cookieHeader) return;

		await fetch(`${baseUrl}/api/chat/usage`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: cookieHeader,
			},
			body: JSON.stringify({
				inputTokens: usage.inputTokens ?? 0,
				outputTokens: usage.outputTokens ?? 0,
				totalTokens: usage.totalTokens ?? 0,
			}),
		});
	} catch (e) {
		console.warn("Janbot usage report failed:", e);
	}
}

/**
 * POST /api/chat
 */
export async function POST(request: Request) {
	try {
		const jwt = extractJwt(request);
		const raw: unknown = await request.json();
		const body = raw as ChatRequestBody;

		if (!isUIMessageArray(body.messages) || body.messages.length === 0) {
			return new Response(
				JSON.stringify({ error: "messages (UIMessage[]) is required" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		const {
			messages,
			model: requestedModel,
			orgSlug,
			fileUpload: bodyFileUpload,
			threadId,
			organizationId,
		} = body;

		const modelId: LlmModel =
			requestedModel && MODEL_CONFIGS[requestedModel]
				? requestedModel
				: DEFAULT_MODEL;

		const model = getModel({ model: modelId });

		const userText = collectLatestUserText(messages);

		if (process.env.JANBOT_SKIP_GUARDRAILS !== "1") {
			const inj = scanUserTextForInjection(userText);
			if (inj.blocked && jwt) {
				await logAbuseEvent({
					jwt,
					threadId,
					kind: "prompt_injection_heuristic",
					snippet: userText.slice(0, 500),
				});
				return new Response(
					JSON.stringify({
						error: "request_blocked",
						message:
							"This message was blocked by a safety filter. Please rephrase and try again.",
					}),
					{ status: 400, headers: { "Content-Type": "application/json" } },
				);
			}

			if (
				userText.trim() &&
				jwt &&
				process.env.JANBOT_INTENT_CLASSIFIER !== "0"
			) {
				const intent = await classifyJanbotIntent(userText);
				if (
					!intent.inScope &&
					intent.confidence > 0.7 &&
					(intent.category === "offtopic" ||
						intent.category === "jailbreak" ||
						intent.category === "abuse")
				) {
					await logAbuseEvent({
						jwt,
						threadId,
						kind: `intent:${intent.category}`,
						snippet: userText.slice(0, 500),
					});
					return new Response(
						JSON.stringify({
							error: "out_of_scope",
							message:
								intent.category === "jailbreak" || intent.category === "abuse"
									? "This request is not allowed."
									: "Janbot only answers questions about AML compliance and your Janovix workspace.",
						}),
						{ status: 400, headers: { "Content-Type": "application/json" } },
					);
				}
			}
		}

		const rawTools = jwt
			? buildJanbotTools({
					jwt,
					orgSlug,
					organizationId,
					fileUpload: bodyFileUpload && jwt ? bodyFileUpload : undefined,
				})
			: {};
		const tools = jwt
			? await filterToolsByJanbotFlags(rawTools, jwt, organizationId)
			: {};
		const hasTools = Object.keys(tools).length > 0;

		let systemPrompt = buildJanbotSystemPrompt();
		if (bodyFileUpload) {
			systemPrompt += `\n\n## Current File Upload
A user has uploaded a file for import:
- **File name**: ${bodyFileUpload.fileName}
- **Type**: ${bodyFileUpload.entityType === "CLIENT" ? "Clients (KYC data)" : "Operations"}

You have access to the \`processImport\` tool to process this file. When the user asks to import or doesn't provide additional instructions, use the tool to process the file after they approve it in the UI.`;
		}

		const modelMessages = await convertToModelMessages(messages, {
			tools: hasTools ? tools : undefined,
		});

		if (threadId && jwt) {
			let lastUser: UIMessage | undefined;
			for (let i = messages.length - 1; i >= 0; i--) {
				if (messages[i].role === "user") {
					lastUser = messages[i];
					break;
				}
			}
			if (lastUser) {
				await persistThreadMessage({
					jwt,
					threadId,
					role: "user",
					parts: lastUser.parts as unknown[],
					metadata: lastUser.metadata,
					id: lastUser.id,
				});
			}
		}

		const result = streamText({
			model,
			system: systemPrompt,
			messages: modelMessages,
			tools: hasTools ? tools : undefined,
			maxOutputTokens: JANBOT_MAX_OUTPUT_TOKENS,
			stopWhen: hasTools
				? [stepCountIs(12), hasToolCall("processImport")]
				: undefined,
			experimental_telemetry: {
				isEnabled: true,
				functionId: "janbot.chat",
				recordInputs: false,
				recordOutputs: false,
				metadata: {
					model: modelId,
					hasJwt: Boolean(jwt),
					threadId: threadId ?? "",
					organizationId: organizationId ?? "",
				},
			},
		});

		return result.toUIMessageStreamResponse({
			originalMessages: messages,
			sendReasoning: true,
			sendSources: true,
			onError: (err) => {
				Sentry.captureException(err);
				return "Janbot hit an error processing this request. Please try again.";
			},
			onFinish: async ({ responseMessage, isAborted }) => {
				if (
					!isAborted &&
					threadId &&
					jwt &&
					responseMessage.role === "assistant"
				) {
					try {
						await persistThreadMessage({
							jwt,
							threadId,
							role: "assistant",
							parts: responseMessage.parts as unknown[],
							model: modelId,
							metadata: responseMessage.metadata,
							id: responseMessage.id,
						});
					} catch (e) {
						console.error("Janbot persist assistant message failed:", e);
					}
				}

				try {
					const usage = await result.totalUsage;
					if (usage) {
						await reportUsageToAuthFromServer({
							inputTokens: usage.inputTokens,
							outputTokens: usage.outputTokens,
							totalTokens: usage.totalTokens,
						});
					}
				} catch (e) {
					console.warn("Janbot usage telemetry failed:", e);
				}
			},
		});
	} catch (error) {
		console.error("Chat API error:", error);
		Sentry.captureException(error);

		if (error instanceof SyntaxError) {
			return new Response(
				JSON.stringify({ error: "Invalid JSON in request body" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		if (
			errorMessage.includes("API key") ||
			errorMessage.includes("apiKey") ||
			errorMessage.includes("OPENAI_API_KEY") ||
			errorMessage.includes("ANTHROPIC_API_KEY") ||
			errorMessage.includes("GOOGLE_GENERATIVE_AI_API_KEY") ||
			errorMessage.includes("AI_GATEWAY_API_KEY")
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

export async function GET() {
	const models = Object.entries(MODEL_CONFIGS).map(([id, config]) => ({
		id,
		...config,
		available: true,
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

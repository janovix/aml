/**
 * AI Chat types for the AML application
 */

// LLM Provider types
export type LlmProvider = "openai" | "anthropic" | "google";

// Available models per provider (1 per vendor for simplicity)
export type OpenAIModel = "gpt-5.2";
export type AnthropicModel = "claude-sonnet-4-6";
export type GoogleModel = "gemini-3-flash-preview";

export type LlmModel = OpenAIModel | AnthropicModel | GoogleModel;

// Model configuration
export interface ModelConfig {
	provider: LlmProvider;
	model: LlmModel;
	/** Vercel AI Gateway model id, e.g. `openai/gpt-5.2` */
	gatewayId?: string;
	displayName: string;
	description: string;
	maxTokens?: number;
	supportsReasoning?: boolean;
	supportsImages?: boolean;
	supportsPdf?: boolean;
	contextWindow?: number;
}

// Token usage tracking
export interface TokenUsage {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
}

// Chat message types
export interface ChatMessage {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	createdAt: Date;
	toolInvocations?: ToolInvocation[];
}

export interface ToolInvocation {
	toolName: string;
	args: Record<string, unknown>;
	result?: unknown;
	state: "pending" | "result" | "error";
}

// API request/response types
export interface ChatRequest {
	messages: Array<{
		role: "user" | "assistant" | "system";
		content: string;
	}>;
	model?: LlmModel;
	provider?: LlmProvider;
}

export interface ChatUsageResponse {
	used: number;
	included: number;
	remaining: number;
	periodStart: string;
	periodEnd: string;
	overageCount: number;
}

// Model configurations (1 per vendor)
export const MODEL_CONFIGS: Record<LlmModel, ModelConfig> = {
	// OpenAI
	"gpt-5.2": {
		provider: "openai",
		model: "gpt-5.2",
		gatewayId: "openai/gpt-5.2",
		displayName: "GPT-5.2",
		description: "OpenAI flagship model",
		maxTokens: 128000,
		contextWindow: 128000,
		supportsImages: true,
		supportsPdf: true,
	},
	// Anthropic
	"claude-sonnet-4-6": {
		provider: "anthropic",
		model: "claude-sonnet-4-6",
		gatewayId: "anthropic/claude-sonnet-4-6",
		displayName: "Claude Sonnet 4.6",
		description: "Latest Claude Sonnet",
		maxTokens: 64000,
		contextWindow: 200000,
		supportsReasoning: true,
		supportsImages: true,
		supportsPdf: true,
	},
	// Google
	"gemini-3-flash-preview": {
		provider: "google",
		model: "gemini-3-flash-preview",
		gatewayId: "google/gemini-3-flash-preview",
		displayName: "Gemini 3 Flash (Preview)",
		description: "Gemini 3 Flash",
		maxTokens: 1000000,
		contextWindow: 1000000,
		supportsReasoning: false,
		supportsImages: true,
		supportsPdf: true,
	},
};

// Helper to get models by provider
export function getModelsByProvider(provider: LlmProvider): ModelConfig[] {
	return Object.values(MODEL_CONFIGS).filter((m) => m.provider === provider);
}

/**
 * Get provider for a model
 */
export function getProviderForModel(model: LlmModel): LlmProvider | undefined {
	const config = MODEL_CONFIGS[model];
	return config?.provider;
}

/**
 * Check if a model is valid
 */
export function isValidModel(model: string): model is LlmModel {
	return model in MODEL_CONFIGS;
}

/**
 * Get model configuration
 */
export function getModelConfig(model: LlmModel): ModelConfig | undefined {
	return MODEL_CONFIGS[model];
}

// Default model
export const DEFAULT_MODEL: LlmModel = "gpt-5.2";
export const DEFAULT_PROVIDER: LlmProvider = "openai";

/** Fast model for Janbot intent / guardrail pre-classification */
export const JANBOT_INTENT_MODEL: LlmModel = "gemini-3-flash-preview";

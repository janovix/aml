/**
 * AI Chat types for the AML application
 */

// LLM Provider types
export type LlmProvider = "openai" | "anthropic" | "google";

// Available models per provider (1 per vendor for simplicity)
export type OpenAIModel = "gpt-4o";
export type AnthropicModel = "claude-3-5-sonnet-20241022";
export type GoogleModel = "gemini-2.0-flash-exp";

export type LlmModel = OpenAIModel | AnthropicModel | GoogleModel;

// Model configuration
export interface ModelConfig {
	provider: LlmProvider;
	model: LlmModel;
	displayName: string;
	description: string;
	maxTokens?: number;
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
	"gpt-4o": {
		provider: "openai",
		model: "gpt-4o",
		displayName: "GPT-4o",
		description: "Most capable OpenAI model",
		maxTokens: 128000,
	},
	// Anthropic
	"claude-3-5-sonnet-20241022": {
		provider: "anthropic",
		model: "claude-3-5-sonnet-20241022",
		displayName: "Claude 3.5 Sonnet",
		description: "Best balance of intelligence and speed",
		maxTokens: 200000,
	},
	// Google
	"gemini-2.0-flash-exp": {
		provider: "google",
		model: "gemini-2.0-flash-exp",
		displayName: "Gemini 2.0 Flash",
		description: "Latest Gemini with fast inference",
		maxTokens: 1000000,
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
export const DEFAULT_MODEL: LlmModel = "gpt-4o";
export const DEFAULT_PROVIDER: LlmProvider = "openai";

/**
 * LLM Provider abstraction for multi-provider support
 *
 * Supports OpenAI, Anthropic, and Google models through Vercel AI SDK
 */

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
	type LlmModel,
	type LlmProvider,
	MODEL_CONFIGS,
	DEFAULT_MODEL,
} from "./types";

/**
 * Available providers
 */
export const AVAILABLE_PROVIDERS: LlmProvider[] = [
	"openai",
	"anthropic",
	"google",
];

/**
 * Provider display names
 */
export const PROVIDER_DISPLAY_NAMES: Record<LlmProvider, string> = {
	openai: "OpenAI",
	anthropic: "Anthropic",
	google: "Google",
};

// Provider instances (lazy initialized)
let openaiInstance: ReturnType<typeof createOpenAI> | null = null;
let anthropicInstance: ReturnType<typeof createAnthropic> | null = null;
let googleInstance: ReturnType<typeof createGoogleGenerativeAI> | null = null;

/**
 * Get or create OpenAI provider instance
 */
function getOpenAI(apiKey?: string): ReturnType<typeof createOpenAI> {
	if (!openaiInstance || apiKey) {
		openaiInstance = createOpenAI({
			apiKey: apiKey || process.env.OPENAI_API_KEY,
		});
	}
	return openaiInstance;
}

/**
 * Get or create Anthropic provider instance
 */
function getAnthropic(apiKey?: string): ReturnType<typeof createAnthropic> {
	if (!anthropicInstance || apiKey) {
		anthropicInstance = createAnthropic({
			apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
		});
	}
	return anthropicInstance;
}

/**
 * Get or create Google provider instance
 */
function getGoogle(
	apiKey?: string,
): ReturnType<typeof createGoogleGenerativeAI> {
	if (!googleInstance || apiKey) {
		googleInstance = createGoogleGenerativeAI({
			apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
		});
	}
	return googleInstance;
}

/**
 * Options for getting a model
 */
export interface GetModelOptions {
	model?: LlmModel;
	openaiApiKey?: string;
	anthropicApiKey?: string;
	googleApiKey?: string;
}

/**
 * Get a language model instance for the specified model
 */
export function getModel(options?: GetModelOptions) {
	const modelId = options?.model ?? DEFAULT_MODEL;
	const config = MODEL_CONFIGS[modelId];

	if (!config) {
		throw new Error(`Unknown model: ${modelId}`);
	}

	switch (config.provider) {
		case "openai":
			return getOpenAI(options?.openaiApiKey)(modelId);

		case "anthropic":
			return getAnthropic(options?.anthropicApiKey)(modelId);

		case "google":
			return getGoogle(options?.googleApiKey)(modelId);

		default:
			throw new Error(`Unknown provider: ${config.provider}`);
	}
}

/**
 * Get the provider for a given model
 */
export function getProviderForModel(model: LlmModel): LlmProvider {
	const config = MODEL_CONFIGS[model];
	if (!config) {
		throw new Error(`Unknown model: ${model}`);
	}
	return config.provider;
}

/**
 * Check if a provider is configured (has API key)
 */
export function isProviderConfigured(provider: LlmProvider): boolean {
	switch (provider) {
		case "openai":
			return !!process.env.OPENAI_API_KEY;
		case "anthropic":
			return !!process.env.ANTHROPIC_API_KEY;
		case "google":
			return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
		default:
			return false;
	}
}

/**
 * Get list of configured providers
 */
export function getConfiguredProviders(): LlmProvider[] {
	const providers: LlmProvider[] = [];
	if (isProviderConfigured("openai")) providers.push("openai");
	if (isProviderConfigured("anthropic")) providers.push("anthropic");
	if (isProviderConfigured("google")) providers.push("google");
	return providers;
}

/**
 * Get available models (only from configured providers)
 */
export function getAvailableModels(): LlmModel[] {
	const configuredProviders = getConfiguredProviders();
	return Object.entries(MODEL_CONFIGS)
		.filter(([, config]) => configuredProviders.includes(config.provider))
		.map(([model]) => model as LlmModel);
}

/**
 * Get display name for a model
 */
export function getModelDisplayName(model: LlmModel): string {
	const config = MODEL_CONFIGS[model];
	return config?.displayName ?? model;
}

/**
 * Get models for a specific provider
 */
export function getModelsForProvider(provider: LlmProvider): LlmModel[] {
	return Object.entries(MODEL_CONFIGS)
		.filter(([, config]) => config.provider === provider)
		.map(([model]) => model as LlmModel);
}

/**
 * Check if a model is available (exists in config)
 */
export function isModelAvailable(model: LlmModel): boolean {
	return model in MODEL_CONFIGS;
}

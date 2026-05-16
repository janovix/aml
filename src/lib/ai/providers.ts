/**
 * LLM Provider abstraction — prefers Vercel AI Gateway when AI_GATEWAY_API_KEY is set.
 */

import { createGateway } from "@ai-sdk/gateway";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
	type LlmModel,
	type LlmProvider,
	MODEL_CONFIGS,
	DEFAULT_MODEL,
} from "./types";

export const AVAILABLE_PROVIDERS: LlmProvider[] = [
	"openai",
	"anthropic",
	"google",
];

export const PROVIDER_DISPLAY_NAMES: Record<LlmProvider, string> = {
	openai: "OpenAI",
	anthropic: "Anthropic",
	google: "Google",
};

let gatewayInstance: ReturnType<typeof createGateway> | null = null;
let openaiInstance: ReturnType<typeof createOpenAI> | null = null;
let anthropicInstance: ReturnType<typeof createAnthropic> | null = null;
let googleInstance: ReturnType<typeof createGoogleGenerativeAI> | null = null;

function getGateway(): ReturnType<typeof createGateway> | null {
	if (!process.env.AI_GATEWAY_API_KEY) {
		return null;
	}
	if (!gatewayInstance) {
		gatewayInstance = createGateway({
			apiKey: process.env.AI_GATEWAY_API_KEY,
		});
	}
	return gatewayInstance;
}

function getOpenAI(apiKey?: string): ReturnType<typeof createOpenAI> {
	if (!openaiInstance || apiKey) {
		openaiInstance = createOpenAI({
			apiKey: apiKey || process.env.OPENAI_API_KEY,
		});
	}
	return openaiInstance;
}

function getAnthropic(apiKey?: string): ReturnType<typeof createAnthropic> {
	if (!anthropicInstance || apiKey) {
		anthropicInstance = createAnthropic({
			apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
		});
	}
	return anthropicInstance;
}

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

export interface GetModelOptions {
	model?: LlmModel;
	openaiApiKey?: string;
	anthropicApiKey?: string;
	googleApiKey?: string;
}

/**
 * Resolve a language model — gateway first (by gatewayId), then direct provider SDKs.
 */
export function getModel(options?: GetModelOptions) {
	const modelId = options?.model ?? DEFAULT_MODEL;
	const config = MODEL_CONFIGS[modelId];

	if (!config) {
		throw new Error(`Unknown model: ${modelId}`);
	}

	const gw = getGateway();
	if (gw && config.gatewayId) {
		return gw(config.gatewayId);
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

export function getProviderForModel(model: LlmModel): LlmProvider {
	const config = MODEL_CONFIGS[model];
	if (!config) {
		throw new Error(`Unknown model: ${model}`);
	}
	return config.provider;
}

export function isProviderConfigured(provider: LlmProvider): boolean {
	if (getGateway()) {
		return true;
	}
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

export function getConfiguredProviders(): LlmProvider[] {
	if (getGateway()) {
		return [...AVAILABLE_PROVIDERS];
	}
	const providers: LlmProvider[] = [];
	if (isProviderConfigured("openai")) providers.push("openai");
	if (isProviderConfigured("anthropic")) providers.push("anthropic");
	if (isProviderConfigured("google")) providers.push("google");
	return providers;
}

export function getAvailableModels(): LlmModel[] {
	const configuredProviders = getConfiguredProviders();
	return Object.entries(MODEL_CONFIGS)
		.filter(([, config]) => configuredProviders.includes(config.provider))
		.map(([model]) => model as LlmModel);
}

export function getModelDisplayName(model: LlmModel): string {
	const config = MODEL_CONFIGS[model];
	return config?.displayName ?? model;
}

export function getModelsForProvider(provider: LlmProvider): LlmModel[] {
	return Object.entries(MODEL_CONFIGS)
		.filter(([, config]) => config.provider === provider)
		.map(([model]) => model as LlmModel);
}

export function isModelAvailable(model: LlmModel): boolean {
	return model in MODEL_CONFIGS;
}

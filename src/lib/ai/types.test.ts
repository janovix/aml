/**
 * Tests for AI types and configuration
 */

import { describe, it, expect } from "vitest";
import {
	DEFAULT_MODEL,
	DEFAULT_PROVIDER,
	MODEL_CONFIGS,
	getProviderForModel,
	isValidModel,
	getModelConfig,
	type LlmModel,
} from "./types";

describe("AI Types", () => {
	describe("DEFAULT_MODEL", () => {
		it("should be a valid model", () => {
			expect(isValidModel(DEFAULT_MODEL)).toBe(true);
		});

		it("should have a configuration", () => {
			expect(MODEL_CONFIGS[DEFAULT_MODEL]).toBeDefined();
		});
	});

	describe("DEFAULT_PROVIDER", () => {
		it("should be openai", () => {
			expect(DEFAULT_PROVIDER).toBe("openai");
		});
	});

	describe("MODEL_CONFIGS", () => {
		it("should have configurations for all expected models", () => {
			const expectedModels: LlmModel[] = [
				"gpt-5.2",
				"claude-sonnet-4-6",
				"gemini-3-flash-preview",
			];

			for (const model of expectedModels) {
				expect(MODEL_CONFIGS[model]).toBeDefined();
				expect(MODEL_CONFIGS[model].provider).toBeDefined();
				expect(MODEL_CONFIGS[model].displayName).toBeDefined();
			}
		});

		it("should have correct providers for each model", () => {
			expect(MODEL_CONFIGS["gpt-5.2"].provider).toBe("openai");
			expect(MODEL_CONFIGS["claude-sonnet-4-6"].provider).toBe("anthropic");
			expect(MODEL_CONFIGS["gemini-3-flash-preview"].provider).toBe("google");
		});
	});

	describe("getProviderForModel", () => {
		it("should return correct provider for OpenAI models", () => {
			expect(getProviderForModel("gpt-5.2")).toBe("openai");
		});

		it("should return correct provider for Anthropic models", () => {
			expect(getProviderForModel("claude-sonnet-4-6")).toBe("anthropic");
		});

		it("should return correct provider for Google models", () => {
			expect(getProviderForModel("gemini-3-flash-preview")).toBe("google");
		});

		it("should return undefined for unknown models", () => {
			expect(getProviderForModel("unknown-model" as LlmModel)).toBeUndefined();
		});
	});

	describe("isValidModel", () => {
		it("should return true for valid models", () => {
			expect(isValidModel("gpt-5.2")).toBe(true);
			expect(isValidModel("claude-sonnet-4-6")).toBe(true);
			expect(isValidModel("gemini-3-flash-preview")).toBe(true);
		});

		it("should return false for invalid models", () => {
			expect(isValidModel("invalid-model")).toBe(false);
			expect(isValidModel("")).toBe(false);
			expect(isValidModel("gpt-5")).toBe(false);
		});
	});

	describe("getModelConfig", () => {
		it("should return config for valid models", () => {
			const config = getModelConfig("gpt-5.2");
			expect(config).toBeDefined();
			expect(config?.provider).toBe("openai");
			expect(config?.displayName).toBe("GPT-5.2");
		});

		it("should return undefined for invalid models", () => {
			expect(getModelConfig("invalid-model" as LlmModel)).toBeUndefined();
		});
	});
});

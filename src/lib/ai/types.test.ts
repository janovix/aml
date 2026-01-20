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
				"gpt-4o",
				"claude-3-5-sonnet-20241022",
				"gemini-2.0-flash-exp",
			];

			for (const model of expectedModels) {
				expect(MODEL_CONFIGS[model]).toBeDefined();
				expect(MODEL_CONFIGS[model].provider).toBeDefined();
				expect(MODEL_CONFIGS[model].displayName).toBeDefined();
			}
		});

		it("should have correct providers for each model", () => {
			expect(MODEL_CONFIGS["gpt-4o"].provider).toBe("openai");
			expect(MODEL_CONFIGS["claude-3-5-sonnet-20241022"].provider).toBe(
				"anthropic",
			);
			expect(MODEL_CONFIGS["gemini-2.0-flash-exp"].provider).toBe("google");
		});
	});

	describe("getProviderForModel", () => {
		it("should return correct provider for OpenAI models", () => {
			expect(getProviderForModel("gpt-4o")).toBe("openai");
		});

		it("should return correct provider for Anthropic models", () => {
			expect(getProviderForModel("claude-3-5-sonnet-20241022")).toBe(
				"anthropic",
			);
		});

		it("should return correct provider for Google models", () => {
			expect(getProviderForModel("gemini-2.0-flash-exp")).toBe("google");
		});

		it("should return undefined for unknown models", () => {
			expect(getProviderForModel("unknown-model" as LlmModel)).toBeUndefined();
		});
	});

	describe("isValidModel", () => {
		it("should return true for valid models", () => {
			expect(isValidModel("gpt-4o")).toBe(true);
			expect(isValidModel("claude-3-5-sonnet-20241022")).toBe(true);
			expect(isValidModel("gemini-2.0-flash-exp")).toBe(true);
		});

		it("should return false for invalid models", () => {
			expect(isValidModel("invalid-model")).toBe(false);
			expect(isValidModel("")).toBe(false);
			expect(isValidModel("gpt-5")).toBe(false);
		});
	});

	describe("getModelConfig", () => {
		it("should return config for valid models", () => {
			const config = getModelConfig("gpt-4o");
			expect(config).toBeDefined();
			expect(config?.provider).toBe("openai");
			expect(config?.displayName).toBe("GPT-4o");
		});

		it("should return undefined for invalid models", () => {
			expect(getModelConfig("invalid-model" as LlmModel)).toBeUndefined();
		});
	});
});

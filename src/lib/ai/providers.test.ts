/**
 * Tests for AI providers configuration
 */

import { describe, it, expect } from "vitest";
import {
	getModelDisplayName,
	getModelsForProvider,
	isModelAvailable,
	AVAILABLE_PROVIDERS,
	PROVIDER_DISPLAY_NAMES,
} from "./providers";
import type { LlmModel, LlmProvider } from "./types";

describe("AI Providers", () => {
	describe("AVAILABLE_PROVIDERS", () => {
		it("should include all expected providers", () => {
			expect(AVAILABLE_PROVIDERS).toContain("openai");
			expect(AVAILABLE_PROVIDERS).toContain("anthropic");
			expect(AVAILABLE_PROVIDERS).toContain("google");
		});

		it("should be an array", () => {
			expect(Array.isArray(AVAILABLE_PROVIDERS)).toBe(true);
		});
	});

	describe("PROVIDER_DISPLAY_NAMES", () => {
		it("should have display names for all providers", () => {
			expect(PROVIDER_DISPLAY_NAMES.openai).toBe("OpenAI");
			expect(PROVIDER_DISPLAY_NAMES.anthropic).toBe("Anthropic");
			expect(PROVIDER_DISPLAY_NAMES.google).toBe("Google");
		});
	});

	describe("getModelDisplayName", () => {
		it("should return display name for OpenAI models", () => {
			expect(getModelDisplayName("gpt-5.2")).toBe("GPT-5.2");
		});

		it("should return display name for Anthropic models", () => {
			expect(getModelDisplayName("claude-sonnet-4-6")).toBe(
				"Claude Sonnet 4.6",
			);
		});

		it("should return display name for Google models", () => {
			expect(getModelDisplayName("gemini-3-flash")).toBe("Gemini 3 Flash");
		});

		it("should return model ID for unknown models", () => {
			expect(getModelDisplayName("unknown-model" as LlmModel)).toBe(
				"unknown-model",
			);
		});
	});

	describe("getModelsForProvider", () => {
		it("should return OpenAI models", () => {
			const models = getModelsForProvider("openai");
			expect(models).toContain("gpt-5.2");
			expect(models).toHaveLength(1);
		});

		it("should return Anthropic models", () => {
			const models = getModelsForProvider("anthropic");
			expect(models).toContain("claude-sonnet-4-6");
			expect(models).toHaveLength(1);
		});

		it("should return Google models", () => {
			const models = getModelsForProvider("google");
			expect(models).toContain("gemini-3-flash");
			expect(models).toHaveLength(1);
		});

		it("should return empty array for unknown provider", () => {
			const models = getModelsForProvider("unknown" as LlmProvider);
			expect(models).toEqual([]);
		});
	});

	describe("isModelAvailable", () => {
		it("should return true for available models", () => {
			expect(isModelAvailable("gpt-5.2")).toBe(true);
			expect(isModelAvailable("claude-sonnet-4-6")).toBe(true);
			expect(isModelAvailable("gemini-3-flash")).toBe(true);
		});

		it("should return false for unavailable models", () => {
			expect(isModelAvailable("gpt-5" as LlmModel)).toBe(false);
			expect(isModelAvailable("unknown" as LlmModel)).toBe(false);
		});
	});
});

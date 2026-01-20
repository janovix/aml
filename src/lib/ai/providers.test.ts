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
			expect(getModelDisplayName("gpt-4o")).toBe("GPT-4o");
		});

		it("should return display name for Anthropic models", () => {
			expect(getModelDisplayName("claude-3-5-sonnet-20241022")).toBe(
				"Claude 3.5 Sonnet",
			);
		});

		it("should return display name for Google models", () => {
			expect(getModelDisplayName("gemini-2.0-flash-exp")).toBe(
				"Gemini 2.0 Flash",
			);
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
			expect(models).toContain("gpt-4o");
			expect(models).toHaveLength(1);
		});

		it("should return Anthropic models", () => {
			const models = getModelsForProvider("anthropic");
			expect(models).toContain("claude-3-5-sonnet-20241022");
			expect(models).toHaveLength(1);
		});

		it("should return Google models", () => {
			const models = getModelsForProvider("google");
			expect(models).toContain("gemini-2.0-flash-exp");
			expect(models).toHaveLength(1);
		});

		it("should return empty array for unknown provider", () => {
			const models = getModelsForProvider("unknown" as LlmProvider);
			expect(models).toEqual([]);
		});
	});

	describe("isModelAvailable", () => {
		it("should return true for available models", () => {
			expect(isModelAvailable("gpt-4o")).toBe(true);
			expect(isModelAvailable("claude-3-5-sonnet-20241022")).toBe(true);
			expect(isModelAvailable("gemini-2.0-flash-exp")).toBe(true);
		});

		it("should return false for unavailable models", () => {
			expect(isModelAvailable("gpt-5" as LlmModel)).toBe(false);
			expect(isModelAvailable("unknown" as LlmModel)).toBe(false);
		});
	});
});

/**
 * AI Token Billing Module
 *
 * Handles token usage tracking and reporting to Stripe for metered billing
 */

import type { TokenUsage } from "./types";

/**
 * Usage tracker interface
 */
export interface UsageTracker {
	limit: number;
	used: number;
	remaining: number;
}

/**
 * Response from token usage API
 */
export interface TokenUsageResponse {
	success: boolean;
	data?: {
		used: number;
		included: number;
		remaining: number;
		periodStart: string;
		periodEnd: string;
		overageCount: number;
	};
	error?: string;
}

/**
 * Create a usage tracker with calculated remaining tokens
 */
export function createUsageTracker(
	limit: number,
	used: number = 0,
): UsageTracker {
	return {
		limit,
		used,
		remaining: limit - used,
	};
}

/**
 * Report token usage to the auth service
 * This will update the organization's usage record and report overage to Stripe
 */
export async function reportTokenUsage(usage: TokenUsage): Promise<boolean> {
	try {
		const response = await fetch("/api/chat/usage", {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				inputTokens: usage.inputTokens,
				outputTokens: usage.outputTokens,
				totalTokens: usage.totalTokens,
			}),
		});

		if (!response.ok) {
			console.error("Failed to report token usage:", response.status);
			return false;
		}

		return true;
	} catch (error) {
		console.error("Error reporting token usage:", error);
		return false;
	}
}

/**
 * Get current token usage for the organization
 */
export async function getTokenUsage(): Promise<TokenUsageResponse> {
	try {
		const response = await fetch("/api/chat/usage", {
			method: "GET",
			credentials: "include",
		});

		if (!response.ok) {
			return {
				success: false,
				error: `Failed to get token usage: ${response.status}`,
			};
		}

		const result = (await response.json()) as TokenUsageResponse;
		return {
			success: true,
			data: result.data,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Check if the organization has remaining tokens
 */
export async function hasRemainingTokens(): Promise<boolean> {
	const usage = await getTokenUsage();
	if (!usage.success || !usage.data) {
		// If we can't check, allow the request (fail open for UX)
		return true;
	}
	return usage.data.remaining > 0;
}

/**
 * Calculate total tokens from usage object
 */
export function calculateTotalTokens(
	promptTokens: number,
	completionTokens: number,
): TokenUsage {
	return {
		inputTokens: promptTokens,
		outputTokens: completionTokens,
		totalTokens: promptTokens + completionTokens,
	};
}

/**
 * Format token count for display
 */
export function formatTokenCount(tokens: number): string {
	if (Math.abs(tokens) >= 1_000_000) {
		return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
	}
	if (Math.abs(tokens) >= 1_000) {
		const k = tokens / 1_000;
		if (k >= 1000) {
			return `${k.toLocaleString()}K`;
		}
		return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
	}
	return tokens.toString();
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(
	used: number,
	limit: number,
	decimals: number = 0,
): number {
	if (limit === 0) return 0;
	const percentage = (used / limit) * 100;
	if (decimals === 0) {
		return Math.round(percentage);
	}
	return Number(percentage.toFixed(decimals));
}

/**
 * Check if usage is over the limit
 */
export function isOverLimit(used: number, limit: number): boolean {
	return used > limit;
}

/**
 * Calculate usage percentage (legacy name for compatibility)
 */
export function calculateUsagePercentage(
	used: number,
	included: number,
): number {
	if (included === 0) return 0;
	return Math.min(100, Math.round((used / included) * 100));
}

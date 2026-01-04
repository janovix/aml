"use client";

import { getClientJwt } from "./authClient";

/**
 * Token cache entry with expiration tracking
 */
interface TokenCacheEntry {
	token: string;
	fetchedAt: number;
	organizationId: string | null;
}

/**
 * Shared token cache to prevent duplicate token requests.
 * Tokens are cached for a configurable duration (default: 5 minutes).
 * Cache is automatically invalidated when organization changes.
 */
class TokenCache {
	private cache: TokenCacheEntry | null = null;
	private fetchPromise: Promise<string | null> | null = null;
	private readonly staleTimeout: number;

	constructor(staleTimeoutMs: number = 5 * 60 * 1000) {
		// Default: 5 minutes
		this.staleTimeout = staleTimeoutMs;
	}

	/**
	 * Get a valid token from cache or fetch a new one.
	 * Returns cached token if it exists and is not stale.
	 * Otherwise, fetches a new token (deduplicates concurrent requests).
	 *
	 * @param organizationId - Current organization ID to validate cache key
	 * @param forceRefresh - Force a new fetch even if cache is valid
	 * @returns JWT token or null
	 */
	async getToken(
		organizationId: string | null,
		forceRefresh: boolean = false,
	): Promise<string | null> {
		// Check if cache is valid and matches current organization
		if (
			!forceRefresh &&
			this.cache &&
			this.cache.organizationId === organizationId &&
			Date.now() - this.cache.fetchedAt < this.staleTimeout
		) {
			return this.cache.token;
		}

		// If cache is for a different organization, clear it
		if (this.cache && this.cache.organizationId !== organizationId) {
			this.clear();
		}

		// If there's already a fetch in progress, wait for it
		if (this.fetchPromise) {
			return this.fetchPromise;
		}

		// Start a new fetch
		this.fetchPromise = this.fetchAndCache(organizationId);

		try {
			const token = await this.fetchPromise;
			return token;
		} finally {
			this.fetchPromise = null;
		}
	}

	/**
	 * Fetch token and update cache
	 */
	private async fetchAndCache(
		organizationId: string | null,
	): Promise<string | null> {
		try {
			const token = await getClientJwt();
			if (token) {
				this.cache = {
					token,
					fetchedAt: Date.now(),
					organizationId,
				};
			} else {
				// Clear cache on failed fetch
				this.clear();
			}
			return token;
		} catch (error) {
			this.clear();
			throw error;
		}
	}

	/**
	 * Clear the token cache
	 */
	clear(): void {
		this.cache = null;
		this.fetchPromise = null;
	}

	/**
	 * Check if cache is valid for the given organization
	 */
	isValid(organizationId: string | null): boolean {
		return (
			this.cache !== null &&
			this.cache.organizationId === organizationId &&
			Date.now() - this.cache.fetchedAt < this.staleTimeout
		);
	}
}

// Export singleton instance
export const tokenCache = new TokenCache();

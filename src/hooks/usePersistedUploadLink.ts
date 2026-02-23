"use client";

import { useState, useEffect, useCallback } from "react";
import type { CreateUploadLinkResponse } from "@/lib/api/doc-svc";

const STORAGE_KEY_PREFIX = "janovix_upload_link_";

/**
 * Persisted upload link with additional metadata
 */
export interface PersistedUploadLink {
	link: CreateUploadLinkResponse;
	clientId: string;
	selectedDocuments: string[];
	createdAt: string;
}

/**
 * Get storage key for a client
 */
function getStorageKey(clientId: string): string {
	return `${STORAGE_KEY_PREFIX}${clientId}`;
}

/**
 * Check if a link is still valid (not expired)
 */
export function isLinkValid(link: CreateUploadLinkResponse): boolean {
	if (!link.expiresAt) return false;
	const expiresAt = new Date(link.expiresAt);
	// Consider expired if less than 5 minutes remaining
	return expiresAt.getTime() - Date.now() > 5 * 60 * 1000;
}

/**
 * Get time remaining until expiration in seconds
 */
export function getTimeRemaining(link: CreateUploadLinkResponse): number {
	if (!link.expiresAt) return 0;
	const expiresAt = new Date(link.expiresAt);
	return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	if (hours > 0) {
		return `${hours}h ${mins}m`;
	}
	if (mins > 0) {
		return `${mins}m`;
	}
	return `${seconds}s`;
}

/**
 * Hook to manage persisted upload links for a client
 */
export function usePersistedUploadLink(clientId: string | undefined) {
	const [persistedLink, setPersistedLink] =
		useState<PersistedUploadLink | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Load persisted link from localStorage on mount
	useEffect(() => {
		if (!clientId) {
			setPersistedLink(null);
			setIsLoading(false);
			return;
		}

		try {
			const stored = localStorage.getItem(getStorageKey(clientId));
			if (stored) {
				const parsed = JSON.parse(stored) as PersistedUploadLink;
				// Only use if link is still valid
				if (isLinkValid(parsed.link)) {
					setPersistedLink(parsed);
				} else {
					// Clean up expired link
					localStorage.removeItem(getStorageKey(clientId));
					setPersistedLink(null);
				}
			} else {
				setPersistedLink(null);
			}
		} catch (error) {
			console.error("Failed to load persisted upload link:", error);
			setPersistedLink(null);
		}
		setIsLoading(false);
	}, [clientId]);

	// Save link to localStorage
	const saveLink = useCallback(
		(link: CreateUploadLinkResponse, selectedDocuments: string[]) => {
			if (!clientId) return;

			const persisted: PersistedUploadLink = {
				link,
				clientId,
				selectedDocuments,
				createdAt: new Date().toISOString(),
			};

			try {
				localStorage.setItem(
					getStorageKey(clientId),
					JSON.stringify(persisted),
				);
				setPersistedLink(persisted);
			} catch (error) {
				console.error("Failed to save upload link:", error);
			}
		},
		[clientId],
	);

	// Clear persisted link
	const clearLink = useCallback(() => {
		if (!clientId) return;

		try {
			localStorage.removeItem(getStorageKey(clientId));
			setPersistedLink(null);
		} catch (error) {
			console.error("Failed to clear upload link:", error);
		}
	}, [clientId]);

	// Check if persisted link is still valid
	const isValid = persistedLink ? isLinkValid(persistedLink.link) : false;

	// Get time remaining
	const timeRemaining = persistedLink
		? getTimeRemaining(persistedLink.link)
		: 0;

	return {
		persistedLink,
		isLoading,
		isValid,
		timeRemaining,
		saveLink,
		clearLink,
	};
}

/**
 * Clean up all expired upload links from localStorage
 * Call this periodically or on app load
 */
export function cleanupExpiredLinks(): void {
	if (typeof window === "undefined") return;

	try {
		const keysToRemove: string[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(STORAGE_KEY_PREFIX)) {
				const stored = localStorage.getItem(key);
				if (stored) {
					try {
						const parsed = JSON.parse(stored) as PersistedUploadLink;
						if (!isLinkValid(parsed.link)) {
							keysToRemove.push(key);
						}
					} catch {
						keysToRemove.push(key);
					}
				}
			}
		}

		keysToRemove.forEach((key) => localStorage.removeItem(key));
	} catch (error) {
		console.error("Failed to cleanup expired links:", error);
	}
}

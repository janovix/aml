"use client";

/**
 * Cross-tab and cross-app session synchronization for AML app.
 *
 * Provides two complementary sync mechanisms:
 * 1. BroadcastChannel - instant sync for tabs on the same origin (same subdomain)
 * 2. visibilitychange/focus - revalidation when tab gains focus (works across subdomains)
 *
 * For multi-app platforms with shared cookies on parent domain (e.g., *.janovix.workers.dev),
 * this ensures signing out in one app is detected by all other apps when they gain focus.
 */

import { authClient } from "./authClient";
import { setSession, clearSession } from "./sessionStore";
import type { Session } from "./types";

/**
 * Message types for cross-tab communication.
 */
export type SessionSyncMessageType = "SESSION_SIGNED_OUT" | "SESSION_UPDATED";

/**
 * Message structure for BroadcastChannel and localStorage.
 */
export interface SessionSyncMessage {
	type: SessionSyncMessageType;
	timestamp: number;
}

/**
 * Channel name for BroadcastChannel.
 * Same channel name across all apps enables cross-app sync (but only works same-origin).
 */
const CHANNEL_NAME = "janovix-session-sync";

/**
 * LocalStorage key for fallback sync.
 */
const STORAGE_KEY = "janovix-session-sync-event";

/**
 * Singleton BroadcastChannel instance.
 */
let broadcastChannel: BroadcastChannel | null = null;

/**
 * Get or create the BroadcastChannel instance.
 * Returns null if BroadcastChannel is not supported.
 */
function getBroadcastChannel(): BroadcastChannel | null {
	if (typeof window === "undefined") {
		return null;
	}

	if (!broadcastChannel && "BroadcastChannel" in window) {
		try {
			broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
		} catch (err) {
			console.warn("[SessionSync] BroadcastChannel creation failed:", err);
			return null;
		}
	}

	return broadcastChannel;
}

/**
 * Post a message to all tabs via BroadcastChannel.
 * Falls back to localStorage event if BroadcastChannel is unavailable.
 */
function postMessage(type: SessionSyncMessageType): void {
	const message: SessionSyncMessage = {
		type,
		timestamp: Date.now(),
	};

	// Try BroadcastChannel first
	const channel = getBroadcastChannel();
	if (channel) {
		try {
			channel.postMessage(message);
		} catch (err) {
			console.warn("[SessionSync] BroadcastChannel post failed:", err);
		}
	}

	// Fallback to localStorage event
	if (typeof window !== "undefined" && window.localStorage) {
		try {
			// Set the value to trigger storage event in other tabs
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
			// Immediately remove it to keep storage clean
			window.localStorage.removeItem(STORAGE_KEY);
		} catch (err) {
			console.warn("[SessionSync] localStorage fallback failed:", err);
		}
	}
}

/**
 * Broadcast a sign-out event to other tabs.
 * Call this after calling clearSession() in your sign-out flow.
 */
export function broadcastSignOut(): void {
	postMessage("SESSION_SIGNED_OUT");
}

/**
 * Broadcast a session update event to other tabs.
 * Call this after calling setSession() in your sign-in or profile update flows.
 */
export function broadcastSessionUpdate(): void {
	postMessage("SESSION_UPDATED");
}

/**
 * Delay helper for retry logic.
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is a transient failure (network, server error) vs auth failure.
 * @param error - Error object from authClient
 * @returns true if the error is transient and should be retried
 */
function isTransientError(error: any): boolean {
	// Check if there's a status code in the error
	const status = error?.status;

	if (status) {
		// 4xx errors (except 408 Request Timeout and 429 Too Many Requests) are auth failures
		if (status >= 400 && status < 500) {
			// These specific 4xx codes are transient
			if (status === 408 || status === 429) {
				return true;
			}
			// All other 4xx are definitive auth failures
			return false;
		}
		// 5xx errors are transient server errors
		if (status >= 500) {
			return true;
		}
	}

	// No status code means network error or other transient failure
	return true;
}

/**
 * Revalidate the session against the server.
 * Updates the session store if valid, clears if invalid.
 *
 * Uses exponential backoff retry for transient failures:
 * - Retries up to 3 times with delays: 1s, 2s, 4s
 * - Only treats 401/403 as definitive auth failures
 * - Network errors and 5xx responses trigger retry
 *
 * @returns true if session is valid, false if invalid/expired
 */
export async function revalidateSession(): Promise<boolean> {
	const MAX_RETRIES = 3;
	const RETRY_DELAYS = [1000, 2000, 4000]; // ms

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const result = await authClient.getSession();

			if (result.error) {
				// Check if this is a transient error that should be retried
				if (isTransientError(result.error) && attempt < MAX_RETRIES) {
					console.warn(
						`[SessionSync] Transient error on attempt ${attempt + 1}/${MAX_RETRIES + 1}, retrying...`,
						result.error,
					);
					await delay(RETRY_DELAYS[attempt]);
					continue;
				}

				// Either a definitive auth failure or we've exhausted retries
				console.error("[SessionSync] Session validation failed:", result.error);
				clearSession();
				return false;
			}

			if (!result.data) {
				// No error but also no data - treat as invalid session
				console.error("[SessionSync] No session data returned");
				clearSession();
				return false;
			}

			// Session is valid - update the store
			const session: Session = {
				user: {
					id: result.data.user.id,
					name: result.data.user.name,
					email: result.data.user.email,
					image: result.data.user.image ?? null,
					emailVerified: result.data.user.emailVerified,
					createdAt:
						result.data.user.createdAt instanceof Date
							? result.data.user.createdAt
							: new Date(result.data.user.createdAt),
					updatedAt:
						result.data.user.updatedAt instanceof Date
							? result.data.user.updatedAt
							: new Date(result.data.user.updatedAt),
				},
				session: {
					id: result.data.session.id,
					userId: result.data.session.userId,
					token: result.data.session.token,
					expiresAt:
						result.data.session.expiresAt instanceof Date
							? result.data.session.expiresAt
							: new Date(result.data.session.expiresAt),
					createdAt:
						result.data.session.createdAt instanceof Date
							? result.data.session.createdAt
							: new Date(result.data.session.createdAt),
					updatedAt:
						result.data.session.updatedAt instanceof Date
							? result.data.session.updatedAt
							: new Date(result.data.session.updatedAt),
					ipAddress: result.data.session.ipAddress ?? undefined,
					userAgent: result.data.session.userAgent ?? undefined,
				},
			};

			setSession(session);
			return true;
		} catch (err) {
			// Network error or thrown exception
			if (attempt < MAX_RETRIES) {
				console.warn(
					`[SessionSync] Exception on attempt ${attempt + 1}/${MAX_RETRIES + 1}, retrying...`,
					err,
				);
				await delay(RETRY_DELAYS[attempt]);
				continue;
			}

			// Exhausted retries on network errors
			console.error("[SessionSync] Revalidation failed after retries:", err);
			clearSession();
			return false;
		}
	}

	// Should not reach here, but handle it
	clearSession();
	return false;
}

/**
 * Callback for handling session sync messages.
 */
export type SessionSyncCallback = (message: SessionSyncMessage) => void;

/**
 * Initialize session synchronization listeners.
 * Returns a cleanup function to remove all listeners.
 *
 * @param onMessage - Callback for handling session sync messages
 * @returns Cleanup function
 */
export function initSessionSync(onMessage: SessionSyncCallback): () => void {
	if (typeof window === "undefined") {
		return () => {}; // No-op for SSR
	}

	const cleanupFunctions: Array<() => void> = [];

	// Setup BroadcastChannel listener
	const channel = getBroadcastChannel();
	if (channel) {
		const handleBroadcastMessage = (
			event: MessageEvent<SessionSyncMessage>,
		) => {
			if (event.data && typeof event.data.type === "string") {
				onMessage(event.data);
			}
		};

		channel.addEventListener("message", handleBroadcastMessage);
		cleanupFunctions.push(() => {
			channel.removeEventListener("message", handleBroadcastMessage);
		});
	}

	// Setup localStorage fallback listener
	const handleStorageEvent = (event: StorageEvent) => {
		if (event.key === STORAGE_KEY && event.newValue) {
			try {
				const message = JSON.parse(event.newValue) as SessionSyncMessage;
				if (message && typeof message.type === "string") {
					onMessage(message);
				}
			} catch (err) {
				console.warn("[SessionSync] Failed to parse storage event:", err);
			}
		}
	};

	window.addEventListener("storage", handleStorageEvent);
	cleanupFunctions.push(() => {
		window.removeEventListener("storage", handleStorageEvent);
	});

	// Return cleanup function that calls all cleanup functions
	return () => {
		cleanupFunctions.forEach((cleanup) => cleanup());
	};
}

/**
 * Cleanup function to close the BroadcastChannel.
 * Call this when the app is being unmounted (usually not needed in SPAs).
 */
export function closeSyncChannel(): void {
	if (broadcastChannel) {
		broadcastChannel.close();
		broadcastChannel = null;
	}
}

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
 * Revalidate the session against the server.
 * Updates the session store if valid, clears if invalid.
 *
 * @returns true if session is valid, false if invalid/expired
 */
export async function revalidateSession(): Promise<boolean> {
	try {
		const result = await authClient.getSession();

		if (result.error || !result.data) {
			// Session is invalid or expired
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
		console.error("[SessionSync] Revalidation failed:", err);
		clearSession();
		return false;
	}
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

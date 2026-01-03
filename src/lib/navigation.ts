/**
 * Navigation utilities for org-aware routing
 *
 * All internal navigation should use these utilities to ensure
 * the organization slug is included in URLs.
 */

import { useOrgStore } from "@/lib/org-store";

/**
 * Get the current organization slug from the store
 * Safe for server-side rendering - returns null on server
 */
export function getOrgSlug(): string | null {
	// On server-side, Zustand persist middleware may try to access localStorage
	// which doesn't exist, causing errors. Return null safely.
	if (typeof window === "undefined") {
		return null;
	}

	try {
		const { currentOrg } = useOrgStore.getState();
		return currentOrg?.slug ?? null;
	} catch {
		// If store access fails (e.g., during SSR hydration), return null
		return null;
	}
}

/**
 * Build an org-scoped path
 * @param path - The path without org prefix (e.g., "/clients", "/transactions/123")
 * @param orgSlug - Optional org slug override, uses current org if not provided
 * @returns The full path with org prefix (e.g., "/algenium/clients")
 */
export function orgPath(path: string, orgSlug?: string): string {
	const slug = orgSlug ?? getOrgSlug();
	if (!slug) {
		// Fallback to path without org - middleware will handle redirect
		return path;
	}
	// Ensure path starts with /
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `/${slug}${normalizedPath}`;
}

/**
 * Navigation paths for common routes
 */
export const routes = {
	home: () => orgPath("/"),
	clients: {
		list: () => orgPath("/clients"),
		new: () => orgPath("/clients/new"),
		detail: (id: string) => orgPath(`/clients/${id}`),
		edit: (id: string) => orgPath(`/clients/${id}/edit`),
	},
	transactions: {
		list: () => orgPath("/transactions"),
		new: () => orgPath("/transactions/new"),
		detail: (id: string) => orgPath(`/transactions/${id}`),
		edit: (id: string) => orgPath(`/transactions/${id}/edit`),
	},
	alerts: {
		list: () => orgPath("/alerts"),
		new: () => orgPath("/alerts/new"),
		detail: (id: string) => orgPath(`/alerts/${id}`),
	},
	reports: {
		list: () => orgPath("/reports"),
	},
	team: () => orgPath("/team"),
	settings: () => orgPath("/settings"),
} as const;

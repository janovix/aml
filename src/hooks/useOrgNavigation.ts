"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useOrgStore } from "@/lib/org-store";

/**
 * Hook for org-aware navigation
 * Returns utilities for building and navigating to org-scoped paths
 */
export function useOrgNavigation() {
	const router = useRouter();
	const params = useParams();
	const urlOrgSlug = params?.orgSlug as string | undefined;
	const { currentOrg } = useOrgStore();

	// Get the org slug from current org or URL
	const orgSlug = currentOrg?.slug || urlOrgSlug;

	/**
	 * Build an org-prefixed path
	 * @param path - Path without org prefix (e.g., "/clients", "/transactions/123")
	 * @returns Full path with org prefix (e.g., "/algenium/clients")
	 */
	const orgPath = useCallback(
		(path: string) => {
			if (!orgSlug) return path;
			const normalizedPath = path.startsWith("/") ? path : `/${path}`;
			return `/${orgSlug}${normalizedPath}`;
		},
		[orgSlug],
	);

	/**
	 * Navigate to an org-prefixed path
	 */
	const navigateTo = useCallback(
		(path: string) => {
			router.push(orgPath(path));
		},
		[router, orgPath],
	);

	/**
	 * Replace current route with an org-prefixed path
	 */
	const replaceTo = useCallback(
		(path: string) => {
			router.replace(orgPath(path));
		},
		[router, orgPath],
	);

	/**
	 * Pre-built route helpers
	 */
	const routes = useMemo(
		() => ({
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
		}),
		[orgPath],
	);

	return {
		orgSlug,
		orgPath,
		navigateTo,
		replaceTo,
		routes,
	};
}

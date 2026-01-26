"use client";

import { createContext, useContext } from "react";

interface OrgSlugContextValue {
	orgSlug: string;
}

export const OrgSlugContext = createContext<OrgSlugContextValue | null>(null);

/**
 * Hook to get the current organization slug from the URL
 */
export function useOrgSlug(): string {
	const context = useContext(OrgSlugContext);
	if (!context) {
		throw new Error("useOrgSlug must be used within an OrgSlugProvider");
	}
	return context.orgSlug;
}

/**
 * Hook to safely get the organization slug, returns null if not in org context
 */
export function useOrgSlugSafe(): string | null {
	const context = useContext(OrgSlugContext);
	return context?.orgSlug ?? null;
}

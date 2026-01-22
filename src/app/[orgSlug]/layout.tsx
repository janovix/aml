"use client";

import { useParams, notFound } from "next/navigation";
import { createContext, useContext, type ReactNode } from "react";
import {
	SubscriptionProvider,
	useSubscription,
	hasAMLAccess,
} from "@/lib/subscription";
import { NoAMLAccess } from "@/components/subscription";

interface OrgSlugContextValue {
	orgSlug: string;
}

const OrgSlugContext = createContext<OrgSlugContextValue | null>(null);

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

/**
 * Validate and extract orgSlug from useParams result
 * Handles undefined, string, or string[] cases
 */
function validateOrgSlug(rawOrgSlug: string | string[] | undefined): string {
	if (!rawOrgSlug) {
		throw new Error("Organization slug is missing from URL parameters");
	}

	// If array, use first element
	const slug = Array.isArray(rawOrgSlug) ? rawOrgSlug[0] : rawOrgSlug;

	if (!slug || typeof slug !== "string") {
		throw new Error("Organization slug is invalid");
	}

	return slug;
}

/**
 * Inner component that checks AML access after SubscriptionProvider is mounted
 */
function AMLAccessGate({ children }: { children: ReactNode }) {
	const { subscription, isLoading } = useSubscription();

	// Show loading state while subscription is being fetched
	if (isLoading) {
		return <NoAMLAccess isLoading />;
	}

	// Only block if there IS subscription data AND it doesn't have AML access
	// This allows access when:
	// - No subscription data (subscription system not set up, new org, development)
	// - Subscription data exists AND has AML access
	// This blocks when:
	// - Subscription data exists but doesn't include AML (e.g., watchlist-only plan)
	if (subscription && !hasAMLAccess(subscription)) {
		return <NoAMLAccess />;
	}

	return <>{children}</>;
}

export default function OrgSlugLayout({ children }: { children: ReactNode }) {
	const params = useParams();

	// Defensive validation of params
	if (!params) {
		notFound();
	}

	let orgSlug: string;
	try {
		orgSlug = validateOrgSlug(params.orgSlug);
	} catch {
		notFound();
	}

	return (
		<OrgSlugContext.Provider value={{ orgSlug }}>
			<SubscriptionProvider>
				<AMLAccessGate>{children}</AMLAccessGate>
			</SubscriptionProvider>
		</OrgSlugContext.Provider>
	);
}

"use client";

import { useParams, notFound } from "next/navigation";
import { type ReactNode } from "react";
import { useSubscriptionSafe } from "@/lib/subscription";
import { hasAMLAccess } from "@/lib/subscription";
import { NoAMLAccess } from "@/components/subscription";
import { OrgSlugContext } from "@/hooks/useOrgSlug";

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

export default function OrgSlugLayout({ children }: { children: ReactNode }) {
	const params = useParams();
	const subscription = useSubscriptionSafe();

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

	// Check AML product access
	// Show loading state while subscription is being fetched
	if (subscription?.isLoading) {
		return <NoAMLAccess isLoading />;
	}

	// If subscription is loaded but user doesn't have AML access, show blocker
	if (subscription && !hasAMLAccess(subscription.subscription)) {
		return <NoAMLAccess />;
	}

	return (
		<OrgSlugContext.Provider value={{ orgSlug }}>
			{children}
		</OrgSlugContext.Provider>
	);
}

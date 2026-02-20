"use client";

import { useParams, notFound } from "next/navigation";
import { type ReactNode } from "react";
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

/**
 * Layout for org-scoped routes.
 *
 * Subscription access and org settings configuration are both validated earlier
 * in OrgBootstrapper before this layout ever mounts, so no loading gates are needed
 * here. This layout simply provides the orgSlug context to all child routes.
 */
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
			{children}
		</OrgSlugContext.Provider>
	);
}

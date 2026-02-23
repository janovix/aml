"use client";

import { useParams, usePathname, notFound } from "next/navigation";
import { type ReactNode } from "react";
import { OrgSlugContext } from "@/hooks/useOrgSlug";
import { useOrgSettings } from "@/hooks/useOrgSettings";
import { ObligatedSubjectSetup } from "@/components/onboarding/ObligatedSubjectSetup";
import { getViewSkeleton } from "@/lib/view-skeletons";
import { hasAMLAccess, useSubscriptionSafe } from "@/lib/subscription";
import { NoAMLAccess } from "@/components/subscription";

/**
 * Derive the view path (without orgSlug prefix) from the full pathname.
 * e.g. "/acme/clients/123/edit" -> "/clients/123/edit"
 */
function getViewPath(pathname: string): string {
	return pathname.replace(/^\/[^/]+/, "") || "/";
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
 * Guard that blocks access until the organization has configured
 * its obligated subject (RFC) and vulnerable activity.
 * Shows the route-aware view skeleton while loading to avoid CLS.
 */
function OrgSettingsGuard({ children }: { children: ReactNode }) {
	const { isConfigured, isLoading, refresh } = useOrgSettings();
	const pathname = usePathname();

	if (isLoading) {
		const ViewSkeleton = getViewSkeleton(getViewPath(pathname ?? "/"));
		return <ViewSkeleton />;
	}

	if (!isConfigured) {
		return <ObligatedSubjectSetup onComplete={refresh} />;
	}

	return <>{children}</>;
}

export default function OrgSlugLayout({ children }: { children: ReactNode }) {
	const params = useParams();
	const pathname = usePathname();
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

	// Check AML product access (works for both Stripe and license-based subscriptions)
	// Show the route-aware view skeleton while loading to avoid CLS.
	if (subscription?.isLoading) {
		const ViewSkeleton = getViewSkeleton(getViewPath(pathname ?? "/"));
		return <ViewSkeleton />;
	}

	// If subscription is loaded but user doesn't have AML access, show blocker
	if (
		subscription &&
		!subscription.isLoading &&
		!hasAMLAccess(subscription.subscription)
	) {
		return <NoAMLAccess />;
	}

	return (
		<OrgSlugContext.Provider value={{ orgSlug }}>
			{children}
		</OrgSlugContext.Provider>
	);
}

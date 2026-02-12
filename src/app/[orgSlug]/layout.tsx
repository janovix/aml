"use client";

import { useParams, notFound } from "next/navigation";
import { type ReactNode } from "react";
import { useSubscriptionSafe } from "@/lib/subscription";
import { hasAMLAccess } from "@/lib/subscription";
import { NoAMLAccess } from "@/components/subscription";
import { OrgSlugContext } from "@/hooks/useOrgSlug";
import { useOrgSettings } from "@/hooks/useOrgSettings";
import { ObligatedSubjectSetup } from "@/components/onboarding/ObligatedSubjectSetup";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthAppUrl } from "@/lib/auth/config";

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
 */
function OrgSettingsGuard({ children }: { children: ReactNode }) {
	const { isConfigured, isLoading, refresh } = useOrgSettings();

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-4">
					<Skeleton className="h-12 w-12 rounded-full" />
					<Skeleton className="h-4 w-48" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
		);
	}

	if (!isConfigured) {
		return (
			<ObligatedSubjectSetup
				onComplete={refresh}
				onSwitchOrg={() => {
					const authUrl = getAuthAppUrl();
					window.location.href = authUrl;
				}}
			/>
		);
	}

	return <>{children}</>;
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

	// Check AML product access (works for both Stripe and license-based subscriptions)
	// Show loading state while subscription is being fetched
	if (subscription?.isLoading) {
		return <NoAMLAccess isLoading />;
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
			<OrgSettingsGuard>{children}</OrgSettingsGuard>
		</OrgSlugContext.Provider>
	);
}

/**
 * Route-to-skeleton mapping utility
 * Maps URL paths to their corresponding skeleton components
 * Used by OrgBootstrapper to show the appropriate skeleton when loading an organization
 */

import type React from "react";
import { DashboardSkeleton } from "@/components/dashboard/DashboardView";
import { ClientDetailsSkeleton } from "@/components/clients/ClientDetailsView";
import { ClientEditSkeleton } from "@/components/clients/ClientEditView";
import { TransactionDetailsSkeleton } from "@/components/transactions/TransactionDetailsView";
import { TransactionEditSkeleton } from "@/components/transactions/TransactionEditView";
import { AlertDetailsSkeleton } from "@/components/alerts/AlertDetailsView";
import { ReportDetailsSkeleton } from "@/components/reports/ReportDetailsView";
import { PageHeroSkeleton } from "@/components/skeletons";
import { TableSkeleton } from "@/components/skeletons";

/**
 * Generic skeleton for list/table views (clients, transactions, alerts, reports)
 */
function ListViewSkeleton(): React.ReactElement {
	return (
		<div className="space-y-6">
			<PageHeroSkeleton showStats={false} showActions={true} actionCount={1} />
			<TableSkeleton rows={10} columns={5} />
		</div>
	);
}

/**
 * Generic skeleton for create/edit form views
 */
function FormViewSkeleton(): React.ReactElement {
	return (
		<div className="space-y-6">
			<PageHeroSkeleton
				showStats={false}
				showBackButton={true}
				actionCount={1}
			/>
			<div className="max-w-4xl space-y-6">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="h-64 rounded-lg border bg-muted/50 animate-pulse"
					/>
				))}
			</div>
		</div>
	);
}

/**
 * Route pattern to skeleton component mapping
 * Patterns are matched against the pathname (without orgSlug prefix)
 */
export const VIEW_SKELETON_MAP: Record<string, () => React.ReactElement> = {
	// Dashboard
	"/": DashboardSkeleton,
	"/dashboard": DashboardSkeleton,

	// Client views
	"/clients": ListViewSkeleton,
	"/clients/new": FormViewSkeleton,
	"/clients/[id]": ClientDetailsSkeleton,
	"/clients/[id]/edit": ClientEditSkeleton,

	// Transaction views
	"/transactions": ListViewSkeleton,
	"/transactions/new": FormViewSkeleton,
	"/transactions/[id]": TransactionDetailsSkeleton,
	"/transactions/[id]/edit": TransactionEditSkeleton,

	// Alert views
	"/alerts": ListViewSkeleton,
	"/alerts/new": FormViewSkeleton,
	"/alerts/[id]": AlertDetailsSkeleton,

	// Report views
	"/reports": ListViewSkeleton,
	"/reports/new": FormViewSkeleton,
	"/reports/[id]": ReportDetailsSkeleton,

	// Settings and team (use generic form skeleton)
	"/settings": FormViewSkeleton,
	"/team": ListViewSkeleton,
};

/**
 * Get the appropriate skeleton component for a given pathname
 * @param pathname - The pathname (e.g., "/clients/123/edit")
 * @returns The skeleton component function, or a default skeleton if no match
 */
export function getViewSkeleton(pathname: string): () => React.ReactElement {
	// Remove leading/trailing slashes and normalize
	const normalized = pathname.replace(/^\/+|\/+$/g, "");

	// Try exact match first
	if (VIEW_SKELETON_MAP[`/${normalized}`]) {
		return VIEW_SKELETON_MAP[`/${normalized}`];
	}

	// Try pattern matching for dynamic routes
	for (const [pattern, skeleton] of Object.entries(VIEW_SKELETON_MAP)) {
		// Convert pattern to regex (e.g., "/clients/[id]" -> "^/clients/[^/]+$")
		const regexPattern = pattern
			.replace(/\[id\]/g, "[^/]+")
			.replace(/\//g, "\\/");
		const regex = new RegExp(`^${regexPattern}$`);

		if (regex.test(`/${normalized}`)) {
			return skeleton;
		}
	}

	// Default to generic form skeleton
	return FormViewSkeleton;
}

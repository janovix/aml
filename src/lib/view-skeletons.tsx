/**
 * Route-to-skeleton mapping utility
 * Maps URL paths to their corresponding skeleton components
 * Used by OrgBootstrapper to show the appropriate skeleton when loading an organization
 */

import type React from "react";
import { DashboardSkeleton } from "@/components/dashboard/DashboardView";
import { ClientDetailsSkeleton } from "@/components/clients/ClientDetailsView";
import { ClientEditSkeleton } from "@/components/clients/ClientEditView";
import { OperationDetailsSkeleton } from "@/components/operations/OperationDetailsView";
import { OperationEditSkeleton } from "@/components/operations/OperationEditView";
import { AlertDetailsSkeleton } from "@/components/alerts/AlertDetailsView";
import { ReportDetailsSkeleton } from "@/components/reports/ReportDetailsView";
import { NoticeDetailsSkeleton } from "@/components/notices/NoticeDetailsView";
import { InvoiceDetailsSkeleton } from "@/components/invoices/InvoiceDetailsView";
import { CfdiReviewSkeleton } from "@/components/invoices/CfdiReviewView";
import { ImportDetailsSkeleton } from "@/components/import/ImportViewContent";
import { PageHeroSkeleton } from "@/components/skeletons";
import { TableSkeleton } from "@/components/skeletons";

/**
 * Generic skeleton for list/table views (clients, operations, alerts, reports)
 */
export function ListViewSkeleton(): React.ReactElement {
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
export function FormViewSkeleton(): React.ReactElement {
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
 * Patterns are matched against the pathname (without orgSlug prefix).
 *
 * Rules for adding new routes:
 *  - List/table views → ListViewSkeleton (or a custom skeleton)
 *  - Create/edit form views → FormViewSkeleton (or a custom skeleton)
 *  - Detail views → a co-located *DetailsSkeleton exported from the view file
 *  - Dynamic segments use bracket notation: [id], [importId], etc.
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

	// Operation views
	"/operations": ListViewSkeleton,
	"/operations/new": FormViewSkeleton,
	"/operations/[id]": OperationDetailsSkeleton,
	"/operations/[id]/edit": OperationEditSkeleton,

	// Alert views
	"/alerts": ListViewSkeleton,
	"/alerts/new": FormViewSkeleton,
	"/alerts/[id]": AlertDetailsSkeleton,

	// Report views
	"/reports": ListViewSkeleton,
	"/reports/new": FormViewSkeleton,
	"/reports/[id]": ReportDetailsSkeleton,

	// Notice views
	"/notices": ListViewSkeleton,
	"/notices/new": FormViewSkeleton,
	"/notices/[id]": NoticeDetailsSkeleton,

	// Invoice views
	"/invoices": ListViewSkeleton,
	"/invoices/upload": FormViewSkeleton,
	"/invoices/[id]": InvoiceDetailsSkeleton,
	"/invoices/[id]/create-operation": CfdiReviewSkeleton,

	// Import views
	"/import": ListViewSkeleton,
	"/import/[importId]": ImportDetailsSkeleton,

	// Settings and team
	"/settings": FormViewSkeleton,
	"/team": ListViewSkeleton,
};

/**
 * Get the appropriate skeleton component for a given pathname.
 * @param pathname - The view path (without orgSlug prefix), e.g. "/clients/123/edit"
 * @returns The skeleton component function, or FormViewSkeleton as a safe default
 */
export function getViewSkeleton(pathname: string): () => React.ReactElement {
	// Normalize: remove leading/trailing slashes then re-add a single leading slash
	const normalized = pathname.replace(/^\/+|\/+$/g, "");

	// Try exact match first
	if (VIEW_SKELETON_MAP[`/${normalized}`]) {
		return VIEW_SKELETON_MAP[`/${normalized}`];
	}

	// Try pattern matching for dynamic routes.
	// Convert bracket segments like [id] or [importId] to a non-slash wildcard.
	for (const [pattern, skeleton] of Object.entries(VIEW_SKELETON_MAP)) {
		const regexPattern = pattern
			.replace(/\[[^\]]+\]/g, "[^/]+") // any [param] → one path segment
			.replace(/\//g, "\\/");
		const regex = new RegExp(`^${regexPattern}$`);

		if (regex.test(`/${normalized}`)) {
			return skeleton;
		}
	}

	// Default to generic form skeleton
	return FormViewSkeleton;
}

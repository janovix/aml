"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
	AlertTriangle,
	FileQuestion,
	Home,
	Lock,
	ShieldOff,
} from "lucide-react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useOrgStore } from "@/lib/org-store";
import { getClientById } from "@/lib/api/clients";
import { getClientDisplayName } from "@/types/client";
import { getReportById } from "@/lib/api/reports";
import { useLanguage } from "@/components/LanguageProvider";
import {
	usePageStatus,
	type PageStatus,
} from "@/components/PageStatusProvider";
import { useJwt } from "@/hooks/useJwt";
import type { TranslationKeys } from "@/lib/translations";

/**
 * Route segment to translation key mapping
 */
const ROUTE_LABEL_KEYS: Record<string, TranslationKeys> = {
	clients: "navClients",
	transactions: "navTransactions",
	alerts: "navAlerts",
	notices: "navNotices",
	reports: "navReports",
	new: "breadcrumbNew",
	edit: "breadcrumbEdit",
};

/**
 * Page status to translation key mapping
 */
const STATUS_LABELS: Record<Exclude<PageStatus, "normal">, TranslationKeys> = {
	"not-found": "breadcrumbNotFound",
	error: "breadcrumbError",
	forbidden: "breadcrumbForbidden",
	unauthorized: "breadcrumbUnauthorized",
};

/**
 * Page status to icon mapping
 */
const STATUS_ICONS: Record<
	Exclude<PageStatus, "normal">,
	React.ComponentType<{ className?: string }>
> = {
	"not-found": FileQuestion,
	error: AlertTriangle,
	forbidden: ShieldOff,
	unauthorized: Lock,
};

/**
 * Check if a segment looks like a UUID or numeric ID
 */
function isIdSegment(segment: string): boolean {
	// UUID pattern
	if (
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
			segment,
		)
	) {
		return true;
	}
	// Numeric ID
	if (/^\d+$/.test(segment)) {
		return true;
	}
	// Short alphanumeric ID (common pattern)
	if (/^[a-z0-9]{6,}$/i.test(segment) && !ROUTE_LABEL_KEYS[segment]) {
		return true;
	}
	return false;
}

interface BreadcrumbSegment {
	labelKey?: TranslationKeys;
	labelFallback: string;
	href: string;
	isCurrentPage: boolean;
	/** ID for dynamic entities (e.g., client ID, report ID) that need name lookup */
	entityId?: string;
	/** Type of entity for dynamic lookup */
	entityType?: "client" | "report";
}

export function NavBreadcrumb() {
	const pathname = usePathname();
	const params = useParams();
	const { currentOrg } = useOrgStore();
	const orgSlug = (params?.orgSlug as string) || currentOrg?.slug;
	const { t } = useLanguage();
	const { jwt } = useJwt();
	const { status } = usePageStatus();

	// Store fetched entity names (e.g., client names, report names)
	const [entityNames, setEntityNames] = React.useState<Record<string, string>>(
		{},
	);

	// Get error status display info if not in normal state
	const isErrorPage = status !== "normal";
	const StatusIcon = isErrorPage ? STATUS_ICONS[status] : null;
	const statusLabel = isErrorPage ? t(STATUS_LABELS[status]) : null;

	const segments = React.useMemo((): BreadcrumbSegment[] => {
		if (!pathname || !orgSlug) return [];

		// Remove org slug from pathname to get the actual route segments
		const pathWithoutOrg = pathname.replace(`/${orgSlug}`, "") || "/";
		const pathSegments = pathWithoutOrg.split("/").filter(Boolean);

		if (pathSegments.length === 0) {
			return [];
		}

		// Build breadcrumb segments
		const breadcrumbs: BreadcrumbSegment[] = [];
		let currentPath = `/${orgSlug}`;

		for (let i = 0; i < pathSegments.length; i++) {
			const segment = pathSegments[i];
			const prevSegment = pathSegments[i - 1];
			currentPath += `/${segment}`;

			// Check if this segment is a client ID (segment after "clients")
			const isClientId = prevSegment === "clients" && isIdSegment(segment);
			// Check if this segment is a report ID (segment after "reports")
			const isReportId = prevSegment === "reports" && isIdSegment(segment);

			// Get translation key or fallback
			const labelKey = ROUTE_LABEL_KEYS[segment];
			let labelFallback: string;
			if (isIdSegment(segment)) {
				// Truncate long IDs for display
				labelFallback =
					segment.length > 8 ? `${segment.slice(0, 8)}…` : segment;
			} else {
				labelFallback = segment.charAt(0).toUpperCase() + segment.slice(1);
			}

			// Determine entity type for dynamic lookup
			let entityType: "client" | "report" | undefined;
			let entityId: string | undefined;
			if (isClientId) {
				entityType = "client";
				entityId = segment;
			} else if (isReportId) {
				entityType = "report";
				entityId = segment;
			}

			breadcrumbs.push({
				labelKey,
				labelFallback,
				href: currentPath,
				isCurrentPage: i === pathSegments.length - 1,
				...(entityId && entityType && { entityId, entityType }),
			});
		}

		return breadcrumbs;
	}, [pathname, orgSlug]);

	// Fetch entity names (clients, reports) for ID segments
	// Wait for JWT to be available (which means org is synced) to avoid 409 errors
	React.useEffect(() => {
		// Don't fetch until JWT is ready (ensures org context is available)
		if (!jwt) return;

		const entitySegments = segments.filter(
			(s) => s.entityType && s.entityId && !entityNames[s.entityId],
		);
		if (entitySegments.length === 0) return;

		const controller = new AbortController();

		for (const segment of entitySegments) {
			if (!segment.entityId) continue;

			if (segment.entityType === "client") {
				getClientById({
					id: segment.entityId,
					signal: controller.signal,
					jwt,
				})
					.then((client) => {
						setEntityNames((prev) => ({
							...prev,
							[segment.entityId!]: getClientDisplayName(client),
						}));
					})
					.catch(() => {
						// Silently fail - keep showing truncated ID
					});
			} else if (segment.entityType === "report") {
				getReportById({ id: segment.entityId, signal: controller.signal, jwt })
					.then((report) => {
						setEntityNames((prev) => ({
							...prev,
							[segment.entityId!]: report.name,
						}));
					})
					.catch(() => {
						// Silently fail - keep showing truncated ID
					});
			}
		}

		return () => controller.abort();
	}, [segments, entityNames, jwt]);

	/**
	 * Get the display label for a segment, using fetched entity name if available
	 */
	const getDisplayLabel = (segment: BreadcrumbSegment): string => {
		if (segment.entityId && entityNames[segment.entityId]) {
			return entityNames[segment.entityId];
		}
		if (segment.labelKey) {
			return t(segment.labelKey);
		}
		return segment.labelFallback;
	};

	// Don't render if we're at the root or there are no segments
	if (segments.length === 0) {
		return (
			<Breadcrumb className="min-w-0 flex-1">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage className="flex items-center gap-1.5">
							{isErrorPage && StatusIcon ? (
								<>
									<StatusIcon className="h-4 w-4" />
									<span className="hidden sm:inline">{statusLabel}</span>
								</>
							) : (
								<>
									<Home className="h-4 w-4" />
									<span className="hidden sm:inline">
										{t("breadcrumbHome")}
									</span>
								</>
							)}
						</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		);
	}

	// When in error state, replace the last segment with error status
	// and make all other segments links (since the last segment is the error)
	const displaySegments = isErrorPage ? segments.slice(0, -1) : segments;

	return (
		<Breadcrumb className="min-w-0 flex-1">
			<BreadcrumbList className="flex-nowrap overflow-x-auto scrollbar-hide">
				{/* Home link */}
				<BreadcrumbItem className="shrink-0">
					<BreadcrumbLink asChild>
						<Link href={`/${orgSlug}`} className="flex items-center gap-1.5">
							<Home className="h-4 w-4" />
							<span className="hidden sm:inline">{t("breadcrumbHome")}</span>
						</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>

				{displaySegments.map((segment) => (
					<React.Fragment key={segment.href}>
						<BreadcrumbSeparator className="shrink-0" />
						<BreadcrumbItem className="shrink-0">
							{segment.isCurrentPage && !isErrorPage ? (
								<BreadcrumbPage>{getDisplayLabel(segment)}</BreadcrumbPage>
							) : (
								<BreadcrumbLink asChild>
									<Link href={segment.href}>{getDisplayLabel(segment)}</Link>
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
					</React.Fragment>
				))}

				{/* Error status segment - shown when page is in error state */}
				{isErrorPage && StatusIcon && statusLabel && (
					<>
						<BreadcrumbSeparator className="shrink-0" />
						<BreadcrumbItem className="shrink-0">
							<BreadcrumbPage className="flex items-center gap-1.5 text-muted-foreground">
								<StatusIcon className="h-4 w-4" />
								{statusLabel}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);
}

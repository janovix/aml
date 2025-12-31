"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Home } from "lucide-react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useOrgStore } from "@/lib/org-store";

/**
 * Route segment to human-readable label mapping
 */
const ROUTE_LABELS: Record<string, string> = {
	clients: "Clientes",
	transactions: "Transacciones",
	alerts: "Alertas",
	reports: "Reportes",
	team: "Equipo",
	settings: "Configuración",
	dashboard: "Dashboard",
	new: "Nuevo",
	edit: "Editar",
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
	if (/^[a-z0-9]{6,}$/i.test(segment) && !ROUTE_LABELS[segment]) {
		return true;
	}
	return false;
}

/**
 * Get label for a path segment
 */
function getSegmentLabel(segment: string): string {
	if (ROUTE_LABELS[segment]) {
		return ROUTE_LABELS[segment];
	}
	if (isIdSegment(segment)) {
		// Truncate long IDs for display
		return segment.length > 8 ? `${segment.slice(0, 8)}…` : segment;
	}
	// Capitalize first letter as fallback
	return segment.charAt(0).toUpperCase() + segment.slice(1);
}

interface BreadcrumbSegment {
	label: string;
	href: string;
	isCurrentPage: boolean;
}

export function NavBreadcrumb() {
	const pathname = usePathname();
	const params = useParams();
	const { currentOrg } = useOrgStore();
	const orgSlug = (params?.orgSlug as string) || currentOrg?.slug;

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
			currentPath += `/${segment}`;

			breadcrumbs.push({
				label: getSegmentLabel(segment),
				href: currentPath,
				isCurrentPage: i === pathSegments.length - 1,
			});
		}

		return breadcrumbs;
	}, [pathname, orgSlug]);

	// Don't render if we're at the root or there are no segments
	if (segments.length === 0) {
		return (
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage className="flex items-center gap-1.5">
							<Home className="h-4 w-4" />
							<span className="hidden sm:inline">Inicio</span>
						</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		);
	}

	return (
		<Breadcrumb className="min-w-0 flex-1">
			<BreadcrumbList className="flex-nowrap overflow-x-auto scrollbar-none">
				{/* Home link */}
				<BreadcrumbItem className="shrink-0">
					<BreadcrumbLink asChild>
						<Link
							href={`/${orgSlug}/clients`}
							className="flex items-center gap-1.5"
						>
							<Home className="h-4 w-4" />
							<span className="hidden sm:inline">Inicio</span>
						</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>

				{segments.map((segment, index) => (
					<React.Fragment key={segment.href}>
						<BreadcrumbSeparator className="shrink-0" />
						<BreadcrumbItem className="shrink-0">
							{segment.isCurrentPage ? (
								<BreadcrumbPage className="max-w-[150px] truncate sm:max-w-[200px]">
									{segment.label}
								</BreadcrumbPage>
							) : (
								<BreadcrumbLink asChild>
									<Link
										href={segment.href}
										className="max-w-[100px] truncate sm:max-w-[150px]"
									>
										{segment.label}
									</Link>
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
					</React.Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}

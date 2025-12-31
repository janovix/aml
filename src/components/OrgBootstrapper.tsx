"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useOrgStore } from "@/lib/org-store";
import { useAuthSession } from "@/lib/auth/useAuthSession";
import {
	listMembers,
	listOrganizations,
	setActiveOrganization,
} from "@/lib/auth/organizations";
import { tokenCache } from "@/lib/auth/tokenCache";
import type { Organization } from "@/lib/org-store";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeroSkeleton } from "@/components/skeletons/page-hero-skeleton";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

/**
 * App skeleton that mimics the dashboard layout structure
 * Shows while loading organization data
 * Uses standardized skeleton components to prevent layout jumping
 */
function AppSkeleton() {
	return (
		<div className="flex h-screen w-full bg-background">
			{/* Sidebar skeleton */}
			<div className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
				<div className="flex h-full flex-col">
					{/* Sidebar header */}
					<div className="flex h-16 items-center gap-3 border-b px-4">
						<Skeleton className="h-8 w-8 rounded-lg" />
						<Skeleton className="h-5 w-28" />
					</div>

					{/* Sidebar nav items */}
					<div className="flex-1 space-y-2 p-4">
						<Skeleton className="h-9 w-full rounded-lg" />
						<Skeleton className="h-9 w-full rounded-lg" />
						<Skeleton className="h-9 w-full rounded-lg" />
						<Skeleton className="h-9 w-3/4 rounded-lg" />
						<div className="pt-4">
							<Skeleton className="mb-2 h-4 w-20" />
							<Skeleton className="h-9 w-full rounded-lg" />
							<Skeleton className="mt-2 h-9 w-full rounded-lg" />
						</div>
					</div>

					{/* Sidebar footer / user */}
					<div className="border-t p-4">
						<div className="flex items-center gap-3">
							<Skeleton className="h-10 w-10 rounded-full" />
							<div className="flex-1 space-y-1.5">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-3 w-32" />
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main content area */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Header skeleton */}
				<header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
					<Skeleton className="h-8 w-8 rounded-md md:hidden" />
					<div className="flex flex-1 items-center justify-end gap-2">
						<Skeleton className="h-8 w-8 rounded-md" />
					</div>
				</header>

				{/* Content skeleton - uses standardized components */}
				<main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
					<div className="space-y-6">
						{/* PageHero skeleton with stats */}
						<PageHeroSkeleton
							showStats={true}
							showActions={true}
							actionCount={1}
						/>

						{/* Table skeleton */}
						<TableSkeleton rows={10} columns={5} />
					</div>
				</main>
			</div>
		</div>
	);
}

interface OrgBootstrapperProps {
	children: React.ReactNode;
	initialOrganizations?: {
		organizations: Organization[];
		activeOrganizationId: string | null;
	};
}

/**
 * OrgBootstrapper - Simplified organization context provider
 *
 * Responsibilities:
 * 1. Sync current org to Zustand store based on URL org slug
 * 2. Set activeOrganizationId in auth session when org is visited
 * 3. Fetch members for the current org
 * 4. Provide loading state while syncing
 *
 * Note: Org validation (access check) is handled by middleware.
 * Note: Org selection UI is handled by the index page.
 */
export function OrgBootstrapper({
	children,
	initialOrganizations,
}: OrgBootstrapperProps) {
	const { data: session } = useAuthSession();
	const params = useParams();
	const urlOrgSlug = params?.orgSlug as string | undefined;

	const {
		currentOrg,
		setCurrentOrg,
		setOrganizations,
		setMembers,
		setLoading,
		setCurrentUserId,
	} = useOrgStore();

	const [isReady, setIsReady] = useState(false);
	const initRef = useRef(false);
	const lastSyncedOrgRef = useRef<string | null | undefined>(null);

	// Set current user ID from session
	useEffect(() => {
		if (session?.user?.id) {
			setCurrentUserId(session.user.id);
		}
	}, [session?.user?.id, setCurrentUserId]);

	// Initialize and sync org on mount or when URL org changes
	useEffect(() => {
		// Skip if no org slug in URL (should be handled by middleware/index)
		if (!urlOrgSlug) {
			setIsReady(true);
			return;
		}

		// Skip if already synced to this org
		if (lastSyncedOrgRef.current === urlOrgSlug && isReady) {
			return;
		}

		async function syncOrg() {
			setLoading(true);

			// Use initial data if available (first load)
			let orgs: Organization[];
			let activeOrgId: string | null = null;

			if (initialOrganizations && !initRef.current) {
				initRef.current = true;
				orgs = initialOrganizations.organizations;
				activeOrgId = initialOrganizations.activeOrganizationId;
				setOrganizations(orgs);
			} else {
				// Fetch organizations
				const result = await listOrganizations();
				if (result.error || !result.data) {
					toast.error("Error loading organizations", {
						description: result.error || "Please try again later.",
					});
					setLoading(false);
					setIsReady(true);
					return;
				}
				orgs = result.data.organizations;
				activeOrgId = result.data.activeOrganizationId;
				setOrganizations(orgs);
			}

			// Find the org matching the URL slug
			const targetOrg = orgs.find((org) => org.slug === urlOrgSlug);

			if (!targetOrg) {
				// Middleware should have caught this, but handle gracefully
				console.warn(`[OrgBootstrapper] Org "${urlOrgSlug}" not found`);
				setLoading(false);
				setIsReady(true);
				return;
			}

			// Set as current org
			setCurrentOrg(targetOrg);

			// Sync activeOrganizationId if different
			if (activeOrgId !== targetOrg.id) {
				tokenCache.clear();
				const syncResult = await setActiveOrganization(targetOrg.id);
				if (syncResult.error) {
					console.error(
						"[OrgBootstrapper] Failed to sync active org:",
						syncResult.error,
					);
				}
			}

			// Fetch members
			const membersResult = await listMembers(targetOrg.id);
			if (membersResult.data) {
				setMembers(membersResult.data);
			} else if (membersResult.error) {
				toast.error("Failed to load team members", {
					description: membersResult.error,
				});
			}

			lastSyncedOrgRef.current = urlOrgSlug;
			setLoading(false);
			setIsReady(true);
		}

		syncOrg();
	}, [
		urlOrgSlug,
		initialOrganizations,
		setCurrentOrg,
		setOrganizations,
		setMembers,
		setLoading,
		isReady,
	]);

	// Show loading skeleton while syncing
	if (!isReady || !currentOrg) {
		return <AppSkeleton />;
	}

	return <>{children}</>;
}

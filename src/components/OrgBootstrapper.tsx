"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
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
import { getViewSkeleton } from "@/lib/view-skeletons";

// Must match the cookie name in sidebar.tsx
const SIDEBAR_COOKIE_NAME = "sidebar_state";

/**
 * Read the sidebar state from the cookie (client-side only)
 * Returns true if expanded, false if collapsed
 */
function getSidebarStateFromCookie(): boolean {
	if (typeof document === "undefined") return true; // Default to expanded on SSR
	const cookies = document.cookie.split(";");
	for (const cookie of cookies) {
		const [name, value] = cookie.trim().split("=");
		if (name === SIDEBAR_COOKIE_NAME) {
			return value !== "false";
		}
	}
	return true; // Default to expanded if no cookie
}

/**
 * App skeleton wrapper that includes sidebar and header
 * Shows the appropriate view skeleton based on the current route
 */
function AppSkeletonWithView({ pathname }: { pathname: string }) {
	// Read sidebar state from cookie to match the actual sidebar
	const isSidebarExpanded = useMemo(() => getSidebarStateFromCookie(), []);

	// Get the view-specific skeleton component
	// Remove orgSlug from pathname to get the view path
	const viewPath = pathname.replace(/^\/[^/]+/, "") || "/";
	const ViewSkeleton = getViewSkeleton(viewPath);

	return (
		<div className="flex h-screen w-full bg-background">
			{/* Sidebar skeleton - respects persisted collapsed/expanded state */}
			<div
				className="hidden shrink-0 border-r bg-sidebar md:block transition-[width] duration-200"
				style={{ width: isSidebarExpanded ? "16rem" : "3rem" }}
			>
				<div className="flex h-full flex-col">
					{/* Sidebar header */}
					<div className="flex h-16 items-center justify-center gap-3 border-b px-2">
						<Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
						{isSidebarExpanded && <Skeleton className="h-5 w-28" />}
					</div>

					{/* Sidebar nav items */}
					<div className="flex-1 space-y-2 p-2">
						{isSidebarExpanded ? (
							<>
								<Skeleton className="h-9 w-full rounded-lg" />
								<Skeleton className="h-9 w-full rounded-lg" />
								<Skeleton className="h-9 w-full rounded-lg" />
								<Skeleton className="h-9 w-3/4 rounded-lg" />
								<div className="pt-4">
									<Skeleton className="mb-2 h-4 w-20" />
									<Skeleton className="h-9 w-full rounded-lg" />
									<Skeleton className="mt-2 h-9 w-full rounded-lg" />
								</div>
							</>
						) : (
							<>
								<Skeleton className="mx-auto h-9 w-9 rounded-lg" />
								<Skeleton className="mx-auto h-9 w-9 rounded-lg" />
								<Skeleton className="mx-auto h-9 w-9 rounded-lg" />
								<Skeleton className="mx-auto h-9 w-9 rounded-lg" />
							</>
						)}
					</div>

					{/* Sidebar footer / user */}
					<div className="border-t p-2">
						{isSidebarExpanded ? (
							<div className="flex items-center gap-3 px-2">
								<Skeleton className="h-10 w-10 shrink-0 rounded-full" />
								<div className="flex-1 space-y-1.5">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-3 w-32" />
								</div>
							</div>
						) : (
							<div className="flex justify-center">
								<Skeleton className="h-8 w-8 rounded-full" />
							</div>
						)}
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

				{/* Content skeleton - uses view-specific skeleton */}
				<main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
					<ViewSkeleton />
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
let hasHydratedOrgs = false;

/**
 * Reset hydration state - for testing only
 */
export function resetOrgHydration() {
	hasHydratedOrgs = false;
}

/**
 * Hydrate the org store synchronously before first render.
 * This must be called before any component reads from useOrgStore.
 */
function hydrateOrgStore(
	initialOrganizations: OrgBootstrapperProps["initialOrganizations"],
	urlOrgSlug: string | undefined,
) {
	if (
		hasHydratedOrgs ||
		typeof window === "undefined" ||
		!initialOrganizations
	) {
		return;
	}

	const storeState = useOrgStore.getState();

	// Only hydrate if store is empty
	if (storeState.organizations.length === 0) {
		const updates: {
			organizations: Organization[];
			currentOrg?: Organization;
		} = {
			organizations: initialOrganizations.organizations,
		};

		// If we have a URL org slug, also set currentOrg
		if (urlOrgSlug) {
			const targetOrg = initialOrganizations.organizations.find(
				(org) => org.slug === urlOrgSlug,
			);
			if (targetOrg) {
				updates.currentOrg = targetOrg;
			}
		}

		useOrgStore.setState(updates);
	}

	hasHydratedOrgs = true;
}

export function OrgBootstrapper({
	children,
	initialOrganizations,
}: OrgBootstrapperProps) {
	const { data: session } = useAuthSession();
	const params = useParams();
	const pathname = usePathname();
	const urlOrgSlug = params?.orgSlug as string | undefined;

	// SYNCHRONOUS HYDRATION: Must happen BEFORE useOrgStore hook reads state
	// This uses a module-level function to ensure it only runs once
	hydrateOrgStore(initialOrganizations, urlOrgSlug);

	const {
		currentOrg,
		organizations,
		setCurrentOrg,
		setOrganizations,
		setMembers,
		setLoading,
		setCurrentUserId,
	} = useOrgStore();

	const [isReady, setIsReady] = useState(false);
	const lastSyncedOrgRef = useRef<string | null | undefined>(null);

	// Set current user ID from session
	useEffect(() => {
		if (session?.user?.id) {
			setCurrentUserId(session.user.id);
		}
	}, [session?.user?.id, setCurrentUserId]);

	// Initialize and sync org on mount or when URL org changes
	useEffect(() => {
		// No org slug in URL (index page for org selection)
		// Organizations already hydrated synchronously above
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

			// Use initial data if available (first load) - already hydrated synchronously
			let orgs: Organization[] = useOrgStore.getState().organizations;
			let activeOrgId: string | null =
				initialOrganizations?.activeOrganizationId ?? null;

			// If no orgs in store, fetch from API
			if (orgs.length === 0) {
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

			// IMPORTANT: Sync activeOrganizationId BEFORE setting currentOrg in the store.
			// This ensures the session's activeOrganizationId is updated in the database
			// BEFORE useJwt hook fetches a new JWT. Otherwise, there's a race condition
			// where the JWT is fetched with organizationId: null because setCurrentOrg
			// triggers useJwt to fetch immediately, before setActiveOrganization completes.
			// This is critical on first organization creation when redirecting from auth app.
			const syncResult = await setActiveOrganization(targetOrg.id);
			if (syncResult.error) {
				console.error(
					"[OrgBootstrapper] Failed to sync active org:",
					syncResult.error,
				);
			}

			// Clear token cache AFTER session is updated, so fresh JWT includes organizationId
			tokenCache.clear();

			// Now set the current org in the store - this triggers useJwt to fetch JWT
			// The session is already updated, so the JWT will have the correct organizationId
			setCurrentOrg(targetOrg);

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
	// When no org slug in URL (index page), don't block on currentOrg - index handles org selection
	if (!isReady) {
		return <AppSkeletonWithView pathname={pathname || "/"} />;
	}

	// Only require currentOrg when we have an org slug in URL
	if (urlOrgSlug && !currentOrg) {
		return <AppSkeletonWithView pathname={pathname || "/"} />;
	}

	return <>{children}</>;
}

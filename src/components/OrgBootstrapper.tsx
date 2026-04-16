"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useStore } from "@nanostores/react";
import { useParams, usePathname, useRouter } from "next/navigation";
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
import * as Sentry from "@sentry/nextjs";
import {
	getSubscriptionStatus,
	hasAMLAccess,
	type SubscriptionStatus,
} from "@/lib/subscription/subscriptionClient";
import { SubscriptionProvider } from "@/lib/subscription";
import {
	getOrganizationSettings,
	type OrganizationSettingsEntity,
} from "@/lib/api/organization-settings";
import { NoAMLAccess } from "@/components/subscription";
import { ObligatedSubjectSetup } from "@/components/onboarding/ObligatedSubjectSetup";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OrgSettingsContext } from "@/contexts/org-settings-context";
import { environmentAtom } from "@/lib/environment-store";

interface BootstrapData {
	subscription: SubscriptionStatus | null;
	orgSettings: OrganizationSettingsEntity | null;
}

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
	const router = useRouter();
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
	const [isRedirecting, setIsRedirecting] = useState(false);
	const [bootstrapData, setBootstrapData] = useState<BootstrapData | null>(
		null,
	);
	const [isRevalidatingOrgSettingsForEnv, setIsRevalidatingOrgSettingsForEnv] =
		useState(false);
	const lastSyncedOrgRef = useRef<string | null | undefined>(null);
	/** Tracks which org the env ref below is aligned with (skip env-only refetch after org URL sync). */
	const bootstrapOrgIdForEnvRef = useRef<string | null>(null);
	/** Last data environment applied to `bootstrapData.orgSettings` (null = not yet aligned for current org). */
	const bootstrapEnvRef = useRef<string | null>(null);
	const environment = useStore(environmentAtom);

	// Set current user ID from session
	useEffect(() => {
		if (session?.user?.id) {
			setCurrentUserId(session.user.id);
		}
	}, [session?.user?.id, setCurrentUserId]);

	// Initialize and sync org on mount or when URL org changes
	useEffect(() => {
		// No org slug in URL - this is the fallback index page (rarely reached)
		// Middleware should redirect to /{orgSlug}, but if we reach here, just mark ready
		if (!urlOrgSlug) {
			setBootstrapData({ subscription: null, orgSettings: null });
			setIsReady(true);
			return;
		}

		// Skip if already synced to this org
		if (lastSyncedOrgRef.current === urlOrgSlug && isReady) {
			return;
		}

		// Check if this org was already switched via OrgSwitcher/AppSidebar
		// Only on SUBSEQUENT navigations (not initial load), we can skip heavy sync
		// On initial load (lastSyncedOrgRef.current is null), always do full sync to ensure session is synced
		const storeState = useOrgStore.getState();
		const isSubsequentNavigation = lastSyncedOrgRef.current !== null;
		const alreadySwitched =
			isSubsequentNavigation && storeState.currentOrg?.slug === urlOrgSlug;

		async function syncOrg() {
			// When switching to a DIFFERENT org (not the initial load), reset bootstrap data
			// immediately to prevent stale data from the previous org from leaking through
			// child guards (OrgSettingsGuard) while the async fetch is in flight.
			if (
				lastSyncedOrgRef.current !== null &&
				lastSyncedOrgRef.current !== urlOrgSlug
			) {
				setBootstrapData(null);
				setIsReady(false);
			}

			// Only show loading state if we need to do a full sync
			if (!alreadySwitched) {
				setLoading(true);
			}

			// Use initial data if available (first load) - already hydrated synchronously
			let orgs: Organization[] = storeState.organizations;

			// If no orgs in store, fetch from API
			if (orgs.length === 0) {
				const result = await listOrganizations();
				if (result.error || !result.data) {
					// Capture error with Sentry
					const error = new Error(
						`Failed to load organizations: ${result.error || "Unknown error"}`,
					);
					Sentry.captureException(error, {
						level: "error",
						tags: {
							component: "OrgBootstrapper",
							action: "listOrganizations",
						},
						extra: {
							urlOrgSlug,
							errorMessage: result.error,
						},
					});

					// Redirect to not-found page - can't load orgs
					setIsRedirecting(true);
					router.replace(`/${urlOrgSlug}/not-found`);
					return;
				}
				orgs = result.data.organizations;
			}

			// Find the org matching the URL slug
			const targetOrg = orgs.find((org) => org.slug === urlOrgSlug);

			if (!targetOrg) {
				// Org not found in user's organizations - redirect to not-found
				const availableSlugs = orgs.map((org) => org.slug).join(", ");
				const error = new Error(
					`Organization "${urlOrgSlug}" not found in user's organizations`,
				);
				Sentry.captureException(error, {
					level: "warning",
					tags: {
						component: "OrgBootstrapper",
						action: "findTargetOrg",
					},
					extra: {
						urlOrgSlug,
						availableOrganizations: availableSlugs,
						organizationCount: orgs.length,
					},
				});

				setIsRedirecting(true);
				router.replace(`/${urlOrgSlug}/not-found`);
				return;
			}

			// If already switched via OrgSwitcher, skip the heavy sync
			// OrgSwitcher already called setActiveOrganization and setCurrentOrg
			if (!alreadySwitched) {
				// IMPORTANT: Sync activeOrganizationId BEFORE setting currentOrg in the store.
				// This ensures the session's activeOrganizationId is updated in the database
				// BEFORE useJwt hook fetches a new JWT. Otherwise, there's a race condition
				// where the JWT is fetched with organizationId: null because setCurrentOrg
				// triggers useJwt to fetch immediately, before setActiveOrganization completes.
				// This is critical on first organization creation when redirecting from auth app.
				const syncResult = await setActiveOrganization(targetOrg.id);
				if (syncResult.error) {
					const error = new Error(
						`Failed to sync active organization: ${syncResult.error}`,
					);
					Sentry.captureException(error, {
						level: "error",
						tags: {
							component: "OrgBootstrapper",
							action: "setActiveOrganization",
						},
						extra: {
							targetOrgId: targetOrg.id,
							targetOrgSlug: targetOrg.slug,
							errorMessage: syncResult.error,
						},
					});
				}

				// Clear token cache AFTER session is updated, so fresh JWT includes organizationId
				tokenCache.clear();

				// Now set the current org in the store - this triggers useJwt to fetch JWT
				// The session is already updated, so the JWT will have the correct organizationId
				setCurrentOrg(targetOrg);
			}

			// Fetch members for the active org + JWT + subscription in parallel.
			// Roles are already pre-populated on each org by listOrganizations() —
			// no N+1 list-members calls needed across all orgs.
			const [currentOrgMembersResult, jwt, subscriptionResult] =
				await Promise.all([
					// Members: only fetch for the active org (full list for the members panel)
					listMembers(targetOrg.id),
					// JWT: needed immediately for org settings fetch below
					tokenCache.getToken(targetOrg.id),
					// Subscription: always fetch to reflect the active org's owner entitlements
					getSubscriptionStatus().catch(() => null),
				]);

			// Fetch org settings (requires JWT) — done after the parallel step since it depends on JWT
			let orgSettings: OrganizationSettingsEntity | null = null;
			if (jwt) {
				try {
					orgSettings = await getOrganizationSettings({ jwt });
				} catch {
					orgSettings = null;
				}
			}

			// Roles already come from listOrganizations(); persist orgs as-is
			setOrganizations(orgs);

			// Set the full member list for the current org
			if (currentOrgMembersResult.data) {
				setMembers(currentOrgMembersResult.data);
			} else if (currentOrgMembersResult.error) {
				toast.error("Failed to load team members", {
					description: currentOrgMembersResult.error ?? undefined,
				});
			}

			// Update bootstrap data with fresh subscription and org settings
			setBootstrapData((prev) => ({
				subscription: subscriptionResult ?? prev?.subscription ?? null,
				orgSettings,
			}));

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
		router,
		// Note: isReady is intentionally NOT in dependencies - it's an output of this effect,
		// not an input. Including it would cause the effect to re-run after setting isReady=true,
		// which is unnecessary and causes issues in tests.
	]);

	const refreshOrgSettingsIntoBootstrap = useCallback(
		async (opts?: { signal?: AbortSignal; organizationId?: string | null }) => {
			const orgId = opts?.organizationId ?? currentOrg?.id ?? null;
			if (!orgId) return;
			if (opts?.signal?.aborted) return;
			const jwt = await tokenCache.getToken(orgId);
			if (!jwt || opts?.signal?.aborted) return;
			try {
				const orgSettings = await getOrganizationSettings({
					jwt,
					signal: opts?.signal,
				});
				if (opts?.signal?.aborted) return;
				setBootstrapData((prev) => (prev ? { ...prev, orgSettings } : prev));
			} catch {
				if (opts?.signal?.aborted) return;
				// ignore — user can retry (leave existing bootstrap orgSettings unchanged)
			}
		},
		[currentOrg?.id],
	);

	const handleOrgSettingsComplete = useCallback(async () => {
		await refreshOrgSettingsIntoBootstrap();
	}, [refreshOrgSettingsIntoBootstrap]);

	// Refetch org settings when the data plane environment changes (X-Environment),
	// so ObligatedSubjectSetup vs main app reflects the selected environment.
	useEffect(() => {
		if (!urlOrgSlug || !isReady || !currentOrg?.id) {
			return;
		}

		const orgId = currentOrg.id;

		if (bootstrapOrgIdForEnvRef.current !== orgId) {
			bootstrapOrgIdForEnvRef.current = orgId;
			bootstrapEnvRef.current = environment;
			return;
		}

		if (bootstrapEnvRef.current === null) {
			bootstrapEnvRef.current = environment;
			return;
		}

		if (bootstrapEnvRef.current === environment) {
			return;
		}

		const ac = new AbortController();

		void (async () => {
			setIsRevalidatingOrgSettingsForEnv(true);
			try {
				await refreshOrgSettingsIntoBootstrap({
					signal: ac.signal,
					organizationId: orgId,
				});
			} finally {
				if (!ac.signal.aborted) {
					bootstrapEnvRef.current = environment;
					setIsRevalidatingOrgSettingsForEnv(false);
				}
			}
		})();

		return () => {
			ac.abort();
			setIsRevalidatingOrgSettingsForEnv(false);
		};
	}, [
		urlOrgSlug,
		isReady,
		currentOrg?.id,
		environment,
		refreshOrgSettingsIntoBootstrap,
	]);

	// Check if we're on an error page (not-found, forbidden)
	// These pages should ALWAYS render immediately, even without currentOrg
	const isErrorPage =
		pathname?.endsWith("/not-found") || pathname?.endsWith("/forbidden");

	// Error pages always render immediately - no skeleton, no waiting
	if (isErrorPage) {
		return <>{children}</>;
	}

	// If redirecting to error page, show skeleton briefly while navigation happens
	if (isRedirecting) {
		return <AppSkeletonWithView pathname={pathname || "/"} />;
	}

	// Detect an in-flight org switch on the very first render after the URL slug changes.
	// lastSyncedOrgRef is only updated at the end of a successful syncOrg(), so when
	// urlOrgSlug differs from it (and it's not the initial load where it's null), we know
	// the async fetch hasn't finished yet. Show the skeleton immediately — before any
	// effect or state update fires — to prevent stale data from the previous org leaking
	// through child guards (OrgSettingsGuard) for even one render cycle.
	const isOrgSwitching =
		lastSyncedOrgRef.current !== null &&
		lastSyncedOrgRef.current !== urlOrgSlug;

	// Show loading skeleton while syncing org and fetching all bootstrap data
	if (
		!isReady ||
		(urlOrgSlug && !currentOrg) ||
		!bootstrapData ||
		isOrgSwitching ||
		isRevalidatingOrgSettingsForEnv
	) {
		return <AppSkeletonWithView pathname={pathname || "/"} />;
	}

	// Subscription gate: block access if user has no active AML subscription
	if (urlOrgSlug && !hasAMLAccess(bootstrapData.subscription)) {
		return (
			<SubscriptionProvider initialData={bootstrapData.subscription}>
				<DashboardLayout hideNavigation initialSidebarCollapsed={false}>
					<NoAMLAccess />
				</DashboardLayout>
			</SubscriptionProvider>
		);
	}

	// Org settings gate: require obligated subject setup before accessing the app
	if (urlOrgSlug && !bootstrapData.orgSettings) {
		return (
			<OrgSettingsContext.Provider
				value={{
					settings: null,
					isLoading: false,
					refresh: handleOrgSettingsComplete,
				}}
			>
				<SubscriptionProvider initialData={bootstrapData.subscription}>
					<DashboardLayout hideNavigation initialSidebarCollapsed={false}>
						<ObligatedSubjectSetup onComplete={handleOrgSettingsComplete} />
					</DashboardLayout>
				</SubscriptionProvider>
			</OrgSettingsContext.Provider>
		);
	}

	// All checks passed — provide org settings via context so every useOrgSettings()
	// caller reads from here instead of making independent HTTP requests.
	return (
		<OrgSettingsContext.Provider
			value={{
				settings: bootstrapData.orgSettings,
				isLoading: false,
				refresh: handleOrgSettingsComplete,
			}}
		>
			<SubscriptionProvider initialData={bootstrapData.subscription}>
				{children}
			</SubscriptionProvider>
		</OrgSettingsContext.Provider>
	);
}

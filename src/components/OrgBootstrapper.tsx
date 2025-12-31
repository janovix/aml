"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useOrgStore } from "@/lib/org-store";
import { useAuthSession } from "@/lib/auth/useAuthSession";
import {
	createOrganization,
	listMembers,
	listOrganizations,
	setActiveOrganization,
} from "@/lib/auth/organizations";
import { tokenCache } from "@/lib/auth/tokenCache";
import type { Organization } from "@/lib/org-store";
import { executeMutation } from "@/lib/mutations";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Building2 } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

interface OrgBootstrapperProps {
	children: React.ReactNode;
	initialOrganizations?: {
		organizations: Organization[];
		activeOrganizationId: string | null;
	};
}

export function OrgBootstrapper({
	children,
	initialOrganizations,
}: OrgBootstrapperProps) {
	const { data: session } = useAuthSession();
	const {
		currentOrg,
		organizations,
		setCurrentOrg,
		setOrganizations,
		setMembers,
		setLoading,
		setError,
		isLoading,
		error,
		setCurrentUserId,
		addOrganization,
	} = useOrgStore();
	// Initialize isBootstrapped to true if we have server-side data
	const [isBootstrapped, setIsBootstrapped] = useState(
		() => !!initialOrganizations,
	);
	// Track if the auth session has been synchronized with the selected organization
	// This ensures the JWT will include the correct organizationId
	const [isSessionSynced, setIsSessionSynced] = useState(false);
	const [nameInput, setNameInput] = useState("");
	const [slugInput, setSlugInput] = useState("");
	const derivedSlug = useMemo(
		() => slugify(slugInput || nameInput),
		[nameInput, slugInput],
	);
	const [isCreating, setIsCreating] = useState(false);
	const initializedRef = useRef(false);
	const sessionSyncRef = useRef(false);

	useEffect(() => {
		if (session?.user?.id) {
			setCurrentUserId(session.user.id);
		}
	}, [session?.user?.id, setCurrentUserId]);

	// Track the last synced organization to detect changes
	const lastSyncedOrgRef = useRef<string | null>(null);

	// Synchronize the auth session with the selected organization
	// This ensures the JWT will include the correct organizationId
	useEffect(() => {
		// Skip if no organization is selected
		if (!currentOrg?.id) {
			return;
		}

		// Skip if already synced with this organization
		if (lastSyncedOrgRef.current === currentOrg.id && isSessionSynced) {
			return;
		}

		// Organization changed - need to re-sync
		if (lastSyncedOrgRef.current !== currentOrg.id) {
			setIsSessionSynced(false);
		}

		// Prevent concurrent syncs for the same org
		if (sessionSyncRef.current) {
			return;
		}

		sessionSyncRef.current = true;

		async function syncSession() {
			try {
				// Clear token cache to ensure we get a fresh JWT after sync
				tokenCache.clear();

				// Update the auth session with the selected organization
				const result = await setActiveOrganization(currentOrg!.id);

				if (result.error) {
					console.error(
						"[OrgBootstrapper] Failed to sync organization:",
						result.error,
					);
					// Don't block the app on sync failure - the user can still use the app
					// and retry organization selection manually
				}

				lastSyncedOrgRef.current = currentOrg!.id;
				setIsSessionSynced(true);
			} catch (error) {
				console.error("[OrgBootstrapper] Error syncing organization:", error);
				// Still mark as synced to unblock the UI - errors will surface in API calls
				lastSyncedOrgRef.current = currentOrg!.id;
				setIsSessionSynced(true);
			} finally {
				sessionSyncRef.current = false;
			}
		}

		syncSession();
	}, [currentOrg?.id, isSessionSynced]);

	// Synchronously initialize store with server-side data before paint
	useLayoutEffect(() => {
		if (initialOrganizations && !initializedRef.current) {
			initializedRef.current = true;
			const nextOrgs = initialOrganizations.organizations;
			setOrganizations(nextOrgs);

			// Validate persisted organization: check if it exists in the list from server
			// This handles cases where: persisted org was deleted, user lost access, org disappeared
			const persistedOrg = currentOrg;
			const persistedOrgFromList = persistedOrg
				? nextOrgs.find((org) => org.id === persistedOrg.id)
				: null;

			// Log if persisted org is no longer valid
			if (persistedOrg && !persistedOrgFromList) {
				console.warn(
					`[OrgBootstrapper] Persisted organization "${persistedOrg.id}" is no longer accessible. Falling back to available organization.`,
				);
			}

			// Use persisted org if available, otherwise fall back to server's active org
			const active =
				persistedOrgFromList ??
				nextOrgs.find(
					(org) => org.id === initialOrganizations.activeOrganizationId,
				) ??
				nextOrgs[0] ??
				null;
			setCurrentOrg(active ?? null);
			setLoading(false);

			// Fetch members asynchronously without blocking render
			if (active) {
				listMembers(active.id).then((membersResult) => {
					if (membersResult.data) {
						setMembers(membersResult.data);
					} else if (membersResult.error) {
						toast.error("Failed to load members", {
							description: membersResult.error,
						});
					}
				});
			}
		}
	}, [
		initialOrganizations,
		setCurrentOrg,
		setOrganizations,
		setLoading,
		setMembers,
	]);

	// Client-side fetch only when no initial data is provided
	useEffect(() => {
		// Skip if we have initial organizations (already handled by useLayoutEffect)
		if (initialOrganizations) {
			return;
		}

		let cancelled = false;
		async function bootstrap() {
			setLoading(true);
			setError(null);

			const result = await listOrganizations();
			if (cancelled) return;

			if (result.error || !result.data) {
				setError(result.error || "Failed to load organizations");
				toast.error("Error loading organizations", {
					description: result.error || "Please try again later.",
				});
				setLoading(false);
				return;
			}

			const nextOrgs = result.data.organizations;
			setOrganizations(nextOrgs);

			// Validate persisted organization: check if it exists in the list from server
			// This handles cases where: persisted org was deleted, user lost access, org disappeared
			const persistedOrg = useOrgStore.getState().currentOrg;
			const persistedOrgFromList = persistedOrg
				? nextOrgs.find((org) => org.id === persistedOrg.id)
				: null;

			// Log if persisted org is no longer valid
			if (persistedOrg && !persistedOrgFromList) {
				console.warn(
					`[OrgBootstrapper] Persisted organization "${persistedOrg.id}" is no longer accessible. Falling back to available organization.`,
				);
			}

			// Use persisted org if available, otherwise fall back to server's active org
			const active =
				persistedOrgFromList ??
				nextOrgs.find((org) => org.id === result.data?.activeOrganizationId) ??
				nextOrgs[0] ??
				null;
			setCurrentOrg(active ?? null);

			if (active) {
				const membersResult = await listMembers(active.id);
				if (!cancelled) {
					if (membersResult.data) {
						setMembers(membersResult.data);
					} else if (membersResult.error) {
						toast.error("Failed to load members", {
							description: membersResult.error,
						});
					}
				}
			}

			setIsBootstrapped(true);
			setLoading(false);
		}

		bootstrap();
		return () => {
			cancelled = true;
		};
	}, [
		initialOrganizations,
		setCurrentOrg,
		setMembers,
		setOrganizations,
		setError,
		setLoading,
	]);

	const showLoading = useMemo(
		() =>
			isLoading ||
			(!isBootstrapped && organizations.length === 0) ||
			// Wait for session to be synced before rendering children
			// This ensures the JWT will have the correct organizationId
			(currentOrg?.id && !isSessionSynced),
		[
			isBootstrapped,
			isLoading,
			organizations.length,
			currentOrg?.id,
			isSessionSynced,
		],
	);

	if (showLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
						<p className="text-muted-foreground">Loading organizations...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!currentOrg || error) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
							<Building2 className="h-8 w-8 text-primary" />
						</div>
						<CardTitle className="text-2xl">
							Create your first organization
						</CardTitle>
						<CardDescription>
							{error ||
								"You need at least one organization to continue. Create your first one to get started."}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="org-name">
								Name
							</label>
							<Input
								id="org-name"
								placeholder="My Organization"
								value={nameInput}
								onChange={(e) => setNameInput(e.target.value)}
							/>
						</div>
						<div className="space-y-1">
							<label className="text-sm font-medium" htmlFor="org-slug">
								Slug (URL identifier)
							</label>
							<Input
								id="org-slug"
								placeholder="my-organization"
								value={slugInput}
								onChange={(e) => setSlugInput(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">
								Final slug:{" "}
								<span className="font-medium">{derivedSlug || "..."}</span>
							</p>
						</div>
					</CardContent>
					<CardFooter>
						<Button
							className="w-full"
							onClick={async () => {
								if (!nameInput || !derivedSlug) return;
								setIsCreating(true);
								try {
									await executeMutation({
										mutation: async () => {
											const result = await createOrganization({
												name: nameInput,
												slug: derivedSlug,
											});
											if (result.error || !result.data) {
												throw new Error(
													result.error || "Failed to create organization",
												);
											}
											return result.data;
										},
										loading: "Creating organization...",
										success: (org) => `${org.name} is ready.`,
										onSuccess: (org) => {
											addOrganization(org);
											setCurrentOrg(org);
											setError(null);
										},
									});
								} catch {
									// Error is already handled by executeMutation via Sonner
								} finally {
									setIsCreating(false);
								}
							}}
							disabled={!nameInput || !derivedSlug || isCreating}
						>
							{isCreating ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create organization"
							)}
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return <>{children}</>;
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Building2, ChevronRight } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	createOrganization,
	listOrganizations,
	setActiveOrganization,
} from "@/lib/auth/organizations";
import { executeMutation } from "@/lib/mutations";
import { useOrgStore, type Organization } from "@/lib/org-store";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * Convert a string to a URL-safe slug
 */
function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * Default page to redirect to after org selection
 */
const DEFAULT_PAGE = "clients";

/**
 * Error messages for query params - will be translated in component
 */
const ERROR_MESSAGE_KEYS: Record<string, string> = {
	kicked: "orgErrorKicked",
	deleted: "orgErrorDeleted",
	invalid: "orgErrorInvalid",
	access_denied: "orgErrorAccessDenied",
};

/**
 * Loading skeleton for the index page
 */
function IndexSkeleton() {
	return (
		<div className="flex min-h-full items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<Skeleton className="mx-auto mb-4 h-16 w-16 rounded-full" />
					<Skeleton className="mx-auto h-8 w-48" />
					<Skeleton className="mx-auto mt-2 h-4 w-64" />
				</CardHeader>
				<CardContent className="space-y-3">
					<Skeleton className="h-16 w-full rounded-lg" />
					<Skeleton className="h-16 w-full rounded-lg" />
				</CardContent>
			</Card>
		</div>
	);
}

/**
 * Organization picker card
 */
function OrgCard({
	org,
	onSelect,
	isSelecting,
}: {
	org: Organization;
	onSelect: (org: Organization) => void;
	isSelecting: boolean;
}) {
	return (
		<button
			onClick={() => onSelect(org)}
			disabled={isSelecting}
			className="flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent disabled:opacity-50"
		>
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Building2 className="h-5 w-5 text-primary" />
				</div>
				<div>
					<div className="font-medium">{org.name}</div>
					<div className="text-sm text-muted-foreground">{org.slug}</div>
				</div>
			</div>
			<ChevronRight className="h-5 w-5 text-muted-foreground" />
		</button>
	);
}

/**
 * Create organization form
 */
function CreateOrgForm({
	onCreated,
}: {
	onCreated: (org: Organization) => void;
}) {
	const { t } = useLanguage();
	const [nameInput, setNameInput] = useState("");
	const [slugInput, setSlugInput] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	const derivedSlug = useMemo(
		() => slugify(slugInput || nameInput),
		[nameInput, slugInput],
	);

	const handleCreate = async () => {
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
						throw new Error(result.error || "Failed to create organization");
					}
					return result.data;
				},
				loading: t("orgCreating"),
				success: (org) => `${org.name} ${t("orgCreateSuccess")}`,
				onSuccess: (org) => {
					onCreated(org);
				},
			});
		} catch {
			// Error is already handled by executeMutation via Sonner
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<div className="flex min-h-full items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4 py-8">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
						<Building2 className="h-8 w-8 text-primary" />
					</div>
					<CardTitle className="text-2xl">{t("orgCreateFirstTitle")}</CardTitle>
					<CardDescription>{t("orgCreateFirstDescription")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor="org-name">
							{t("orgNameLabel")}
						</label>
						<Input
							id="org-name"
							placeholder={t("orgNamePlaceholder")}
							value={nameInput}
							onChange={(e) => setNameInput(e.target.value)}
						/>
					</div>
					<div className="space-y-1">
						<label className="text-sm font-medium" htmlFor="org-slug">
							{t("orgSlugLabel")}
						</label>
						<Input
							id="org-slug"
							placeholder={t("orgSlugPlaceholder")}
							value={slugInput}
							onChange={(e) => setSlugInput(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							{t("orgSlugFinal")}{" "}
							<span className="font-medium">{derivedSlug || "..."}</span>
						</p>
					</div>
				</CardContent>
				<CardFooter>
					<Button
						className="w-full"
						onClick={handleCreate}
						disabled={!nameInput || !derivedSlug || isCreating}
					>
						{isCreating ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{t("orgCreating")}
							</>
						) : (
							t("orgCreateButton")
						)}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

/**
 * Organization picker
 */
function OrgPicker({
	organizations,
	activeOrgId,
	onSelect,
}: {
	organizations: Organization[];
	activeOrgId: string | null;
	onSelect: (org: Organization) => void;
}) {
	const { t } = useLanguage();
	const [isSelecting, setIsSelecting] = useState(false);

	const handleSelect = async (org: Organization) => {
		setIsSelecting(true);
		try {
			// Set as active org in auth session
			await setActiveOrganization(org.id);
			onSelect(org);
		} catch {
			toast.error(t("orgSelectFailed"));
			setIsSelecting(false);
		}
	};

	// Sort orgs with active org first
	const sortedOrgs = useMemo(() => {
		return [...organizations].sort((a, b) => {
			if (a.id === activeOrgId) return -1;
			if (b.id === activeOrgId) return 1;
			return a.name.localeCompare(b.name);
		});
	}, [organizations, activeOrgId]);

	return (
		<div className="flex min-h-full items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4 py-8">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
						<Building2 className="h-8 w-8 text-primary" />
					</div>
					<CardTitle className="text-2xl">{t("orgSelectTitle")}</CardTitle>
					<CardDescription>{t("orgSelectDescription")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{sortedOrgs.map((org) => (
						<OrgCard
							key={org.id}
							org={org}
							onSelect={handleSelect}
							isSelecting={isSelecting}
						/>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

/**
 * Index page - Org selection hub
 *
 * Redirect priority:
 * 1. If activeOrganizationId exists (previously selected org) → redirect to that org
 * 2. If only 1 org → auto-redirect to that org
 * 3. If 2+ orgs with no activeOrganizationId → show org picker
 * 4. If 0 orgs → show create org form
 *
 * Also handles error query params with toast notifications (kicked, deleted, etc.)
 */
export default function IndexPage() {
	const { t } = useLanguage();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isLoading, setIsLoading] = useState(true);
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const hasRedirected = useRef(false);
	const hasFetched = useRef(false);

	// Get organizations from store (populated by OrgBootstrapper from server data)
	const storeOrganizations = useOrgStore((state) => state.organizations);

	// Show error toast if redirected with error param
	useEffect(() => {
		const errorParam = searchParams.get("error");
		if (errorParam && ERROR_MESSAGE_KEYS[errorParam]) {
			toast.error(t(ERROR_MESSAGE_KEYS[errorParam] as any));
			// Clear the error param from URL
			const newParams = new URLSearchParams(searchParams.toString());
			newParams.delete("error");
			const newUrl = newParams.toString() ? `/?${newParams.toString()}` : "/";
			router.replace(newUrl);
		}
	}, [searchParams, router, t]);

	// Load organizations on mount - prefer store data, fallback to API
	useEffect(() => {
		// Prevent double fetch in React 18 strict mode
		if (hasFetched.current) return;
		hasFetched.current = true;

		async function fetchOrgs() {
			setIsLoading(true);

			// Use store data if available (populated from server by OrgBootstrapper)
			let orgs: Organization[];
			let fetchedActiveOrgId: string | null = null;

			if (storeOrganizations.length > 0) {
				orgs = storeOrganizations;
			} else {
				// Fallback to client-side API call
				const result = await listOrganizations();

				if (result.error || !result.data) {
					setError(result.error || t("orgErrorLoading"));
					toast.error(t("orgErrorLoading"), {
						description: result.error || t("orgErrorLoadingDesc"),
					});
					setIsLoading(false);
					return;
				}

				orgs = result.data.organizations;
				fetchedActiveOrgId = result.data.activeOrganizationId;
			}

			setOrganizations(orgs);
			if (fetchedActiveOrgId) {
				setActiveOrgId(fetchedActiveOrgId);
			}

			// No orgs - will show create form
			if (orgs.length === 0) {
				setIsLoading(false);
				return;
			}

			// Helper to redirect (only once)
			const redirectToOrg = (org: Organization) => {
				if (hasRedirected.current) return;
				hasRedirected.current = true;
				router.replace(`/${org.slug}/${DEFAULT_PAGE}`);
			};

			// Priority 1: If user has a previously selected org (activeOrganizationId), use that
			if (fetchedActiveOrgId) {
				const activeOrg = orgs.find((o) => o.id === fetchedActiveOrgId);
				if (activeOrg) {
					redirectToOrg(activeOrg);
					return;
				}
			}

			// Priority 2: If only 1 org, auto-redirect to it
			if (orgs.length === 1) {
				const org = orgs[0];
				// Set as active in background (don't block redirect)
				setActiveOrganization(org.id).catch((err) => {
					console.error("Failed to set active organization:", err);
				});
				redirectToOrg(org);
				return;
			}

			// Multiple orgs with no activeOrganizationId - show picker
			setIsLoading(false);
		}

		fetchOrgs();
	}, [router, storeOrganizations, t]);

	// Handle org selection
	const handleOrgSelect = (org: Organization) => {
		router.replace(`/${org.slug}/${DEFAULT_PAGE}`);
	};

	// Handle org creation
	const handleOrgCreated = async (org: Organization) => {
		// Set as active and redirect
		await setActiveOrganization(org.id);
		router.replace(`/${org.slug}/${DEFAULT_PAGE}`);
	};

	// Loading state
	if (isLoading) {
		return <IndexSkeleton />;
	}

	// Error state - show create form with error message
	if (error) {
		return <CreateOrgForm onCreated={handleOrgCreated} />;
	}

	// No orgs - show create form
	if (organizations.length === 0) {
		return <CreateOrgForm onCreated={handleOrgCreated} />;
	}

	// Multiple orgs - show picker
	return (
		<OrgPicker
			organizations={organizations}
			activeOrgId={activeOrgId}
			onSelect={handleOrgSelect}
		/>
	);
}

"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useOrgStore } from "@/lib/org-store";
import { useAuthSession } from "@/lib/auth/useAuthSession";
import {
	createOrganization,
	listMembers,
	listOrganizations,
} from "@/lib/auth/organizations";
import type { Organization } from "@/lib/org-store";
import { useToast } from "@/hooks/use-toast";
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
	const { toast } = useToast();
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
	const [nameInput, setNameInput] = useState("");
	const [slugInput, setSlugInput] = useState("");
	const derivedSlug = useMemo(
		() => slugify(slugInput || nameInput),
		[nameInput, slugInput],
	);
	const [isCreating, setIsCreating] = useState(false);
	const initializedRef = useRef(false);

	useEffect(() => {
		if (session?.user?.id) {
			setCurrentUserId(session.user.id);
		}
	}, [session?.user?.id, setCurrentUserId]);

	// Synchronously initialize store with server-side data before paint
	useLayoutEffect(() => {
		if (initialOrganizations && !initializedRef.current) {
			initializedRef.current = true;
			const nextOrgs = initialOrganizations.organizations;
			setOrganizations(nextOrgs);

			const active =
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
						toast({
							variant: "destructive",
							title: "Failed to load members",
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
		toast,
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
				toast({
					variant: "destructive",
					title: "Error loading organizations",
					description: result.error || "Please try again later.",
				});
				setLoading(false);
				return;
			}

			const nextOrgs = result.data.organizations;
			setOrganizations(nextOrgs);

			const active =
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
						toast({
							variant: "destructive",
							title: "Failed to load members",
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
		toast,
	]);

	const showLoading = useMemo(
		() => isLoading || (!isBootstrapped && organizations.length === 0),
		[isBootstrapped, isLoading, organizations.length],
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
								const result = await createOrganization({
									name: nameInput,
									slug: derivedSlug,
								});
								if (result.error || !result.data) {
									toast({
										variant: "destructive",
										title: "Failed to create organization",
										description: result.error || "Please try again.",
									});
								} else {
									addOrganization(result.data);
									setCurrentOrg(result.data);
									setError(null);
									toast({
										title: "Organization created",
										description: `${result.data.name} is ready.`,
									});
								}
								setIsCreating(false);
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

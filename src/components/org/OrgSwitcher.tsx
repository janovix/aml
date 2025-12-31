"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useOrgStore } from "@/lib/org-store";
import { formatProperNoun } from "@/lib/utils";
import {
	createOrganization,
	setActiveOrganization,
} from "@/lib/auth/organizations";
import type React from "react";

function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function getOrgInitials(name: string) {
	return name
		.split(" ")
		.map((word) => word[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function CreateOrganizationDialog({
	trigger,
	onCreated,
}: {
	trigger: React.ReactNode;
	onCreated: (
		org: Awaited<ReturnType<typeof createOrganization>>["data"],
	) => void;
}) {
	const { toast } = useToast();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [logo, setLogo] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const derivedSlug = useMemo(
		() => (slug ? slugify(slug) : slugify(name)),
		[name, slug],
	);

	const resetForm = () => {
		setName("");
		setSlug("");
		setLogo("");
		setError(null);
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (isSubmitting) return;
		setIsSubmitting(true);
		setError(null);

		const result = await createOrganization({
			name,
			slug: derivedSlug,
			logo: logo || undefined,
		});

		if (result.error || !result.data) {
			setError(result.error || "Please try again later.");
		} else {
			onCreated(result.data);
			toast({
				title: "Organization created",
				description: `${result.data.name} has been created.`,
			});
			setOpen(false);
			resetForm();
		}

		setIsSubmitting(false);
	};

	const handleOpenChange = (isOpen: boolean) => {
		setOpen(isOpen);
		if (!isOpen) {
			resetForm();
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>New organization</DialogTitle>
					<DialogDescription>
						Create an organization to manage your team and data.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
							{error}
						</div>
					)}
					<div className="space-y-2">
						<Label htmlFor="org-name">Name</Label>
						<Input
							id="org-name"
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								setError(null);
							}}
							required
							placeholder="My organization"
						/>
					</div>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="org-slug">Slug</Label>
							<span className="text-xs text-muted-foreground">
								Used in the URL
							</span>
						</div>
						<Input
							id="org-slug"
							value={slug}
							onChange={(e) => {
								setSlug(e.target.value);
								setError(null);
							}}
							placeholder="my-organization"
						/>
						<p className="text-xs text-muted-foreground">
							Final slug:{" "}
							<span className="font-medium">{derivedSlug || "..."}</span>
						</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor="org-logo">Logo (optional URL)</Label>
						<Input
							id="org-logo"
							value={logo}
							onChange={(e) => setLogo(e.target.value)}
							placeholder="https://example.com/logo.png"
						/>
					</div>
					<Separator />
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting || !name}>
							{isSubmitting ? "Creating..." : "Create organization"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export function OrgSwitcher() {
	const { toast } = useToast();
	const { currentOrg, organizations, setCurrentOrg, addOrganization } =
		useOrgStore();
	const [isSwitching, setIsSwitching] = useState(false);
	const activeOrgs = organizations.filter((org) => org.status === "active");

	const handleSwitch = async (orgId: string) => {
		if (isSwitching) return;
		setIsSwitching(true);
		const org = organizations.find((o) => o.id === orgId);
		const result = await setActiveOrganization(orgId);

		if (result.error || !org) {
			toast({
				variant: "destructive",
				title: "Failed to switch organization",
				description: result.error ?? "Please try again.",
			});
		} else {
			setCurrentOrg(org);
			toast({
				title: "Active organization updated",
				description: `${org.name} is now your active organization.`,
			});
		}
		setIsSwitching(false);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton
					size="lg"
					className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
				>
					<Avatar className="h-8 w-8 rounded-lg">
						<AvatarImage
							src={currentOrg?.logo || "/placeholder.svg"}
							alt={currentOrg?.name || "Organization"}
						/>
						<AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs">
							{currentOrg ? getOrgInitials(currentOrg.name) : "?"}
						</AvatarFallback>
					</Avatar>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-semibold">
							{currentOrg?.name ? formatProperNoun(currentOrg.name) : "Select"}
						</span>
						<span className="truncate text-xs text-muted-foreground capitalize">
							{currentOrg?.plan ? `${currentOrg.plan} plan` : "No plan"}
						</span>
					</div>
					<ChevronsUpDown className="ml-auto size-4" />
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
				side="bottom"
				align="start"
				sideOffset={4}
			>
				<DropdownMenuLabel className="text-xs text-muted-foreground">
					My Organizations
				</DropdownMenuLabel>
				{activeOrgs.map((org) => (
					<DropdownMenuItem
						key={org.id}
						onClick={() => handleSwitch(org.id)}
						className="gap-2 p-2"
						disabled={isSwitching}
					>
						<Avatar className="h-6 w-6 rounded-md">
							<AvatarImage
								src={org.logo || "/placeholder.svg"}
								alt={org.name}
							/>
							<AvatarFallback className="rounded-md bg-primary/10 text-xs">
								{getOrgInitials(org.name)}
							</AvatarFallback>
						</Avatar>
						<span className="flex-1 truncate">
							{formatProperNoun(org.name)}
						</span>
						{org.id === currentOrg?.id && (
							<span className="h-2 w-2 rounded-full bg-primary" />
						)}
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<CreateOrganizationDialog
					trigger={
						<DropdownMenuItem
							className="gap-2 p-2"
							onSelect={(e) => e.preventDefault()}
						>
							<div className="flex h-6 w-6 items-center justify-center rounded-md border bg-background">
								<Plus className="h-4 w-4" />
							</div>
							<span className="font-medium">New organization</span>
						</DropdownMenuItem>
					}
					onCreated={(org) => {
						if (!org) return;
						addOrganization(org);
						setCurrentOrg(org);
					}}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

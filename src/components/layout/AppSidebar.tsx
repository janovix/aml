"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
	Users,
	AlertTriangle,
	FileText,
	Settings,
	BarChart3,
	Database,
	Clock,
	Briefcase,
	UsersRound,
} from "lucide-react";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarSeparator,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuthSession } from "@/lib/auth/useAuthSession";
import { logout } from "@/lib/auth/actions";
import {
	setActiveOrganization,
	createOrganization,
} from "@/lib/auth/organizations";
import { useOrgStore, type Organization } from "@/lib/org-store";
import { executeMutation } from "@/lib/mutations";
import { toast } from "sonner";
import {
	OrganizationSwitcher,
	type Organization as LegacyOrganization,
} from "./OrganizationSwitcher";
import { NavUser } from "./NavUser";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { slugify } from "@/lib/slugify";
import { Plus } from "lucide-react";

const mainNavItems = [
	{
		title: "Dashboard",
		href: "/dashboard",
		icon: BarChart3,
		available: false,
	},
	{
		title: "Clientes",
		href: "/clients",
		icon: Users,
		available: true,
	},
	{
		title: "Alertas",
		href: "/alerts",
		icon: AlertTriangle,
		available: true,
	},
	{
		title: "Transacciones",
		href: "/transactions",
		icon: Briefcase,
		available: true,
	},
	{
		title: "Reportes",
		href: "/reports",
		icon: FileText,
		available: true,
	},
];

const secondaryNavItems = [
	{
		title: "Modelos de Riesgo",
		href: "/modelos",
		icon: Database,
		available: false,
	},
	{
		title: "Historial",
		href: "/historial",
		icon: Clock,
		available: false,
	},
];

const orgNavItems = [
	{
		title: "Team",
		href: "/team",
		icon: UsersRound,
		available: true,
	},
	{
		title: "Configuración",
		href: "/settings",
		icon: Settings,
		available: true,
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const router = useRouter();
	const params = useParams();
	const urlOrgSlug = params?.orgSlug as string | undefined;
	const { isMobile, setOpenMobile } = useSidebar();
	const { data: session, isPending } = useAuthSession();

	// Use org-store for organization state
	const {
		currentOrg,
		organizations,
		setCurrentOrg,
		isLoading: orgLoading,
	} = useOrgStore();

	// Get org slug from current org or URL
	const orgSlug = currentOrg?.slug || urlOrgSlug;

	// Helper to build org-prefixed paths
	const orgPath = React.useCallback(
		(path: string) => {
			if (!orgSlug) return path;
			return `/${orgSlug}${path}`;
		},
		[orgSlug],
	);

	// Check if a nav item is active (considering org prefix)
	const isNavActive = React.useCallback(
		(itemHref: string) => {
			if (!pathname) return false;
			const fullPath = orgPath(itemHref);
			return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
		},
		[pathname, orgPath],
	);

	const handleLinkClick = React.useCallback(() => {
		if (isMobile) {
			setOpenMobile(false);
		}
	}, [isMobile, setOpenMobile]);

	const handleLogout = async () => {
		await logout();
	};

	const handleOrganizationChange = async (org: LegacyOrganization) => {
		try {
			await executeMutation({
				mutation: async () => {
					const result = await setActiveOrganization(org.id);
					if (result.error) {
						throw new Error(result.error);
					}
					return result.data;
				},
				loading: "Switching organization...",
				success: () => {
					const fullOrg = organizations.find((o) => o.id === org.id);
					return `${fullOrg?.name || org.name} is now active.`;
				},
				onSuccess: () => {
					const fullOrg = organizations.find((o) => o.id === org.id);
					if (fullOrg) {
						setCurrentOrg(fullOrg);

						// Update URL to reflect new org slug
						if (urlOrgSlug && pathname) {
							const pathSegments = pathname.split("/").filter(Boolean);
							if (pathSegments.length > 0 && pathSegments[0] === urlOrgSlug) {
								// Replace old org slug with new one
								const newPath = `/${fullOrg.slug}/${pathSegments.slice(1).join("/")}`;
								router.replace(newPath);
							} else if (pathSegments.length === 0) {
								// Navigate to default page for new org
								router.replace(`/${fullOrg.slug}/clients`);
							}
						} else {
							// No org in URL, navigate to new org's default page
							router.replace(`/${fullOrg.slug}/clients`);
						}
					}
				},
			});
		} catch {
			// Error is already handled by executeMutation via Sonner
		}
	};

	const [createOrgDialogOpen, setCreateOrgDialogOpen] = React.useState(false);
	const [orgName, setOrgName] = React.useState("");
	const [newOrgSlug, setNewOrgSlug] = React.useState("");
	const [orgLogo, setOrgLogo] = React.useState("");
	const [isCreatingOrg, setIsCreatingOrg] = React.useState(false);
	const [createOrgError, setCreateOrgError] = React.useState<string | null>(
		null,
	);

	const derivedSlug = React.useMemo(
		() => (newOrgSlug ? slugify(newOrgSlug) : slugify(orgName)),
		[orgName, newOrgSlug],
	);

	const handleCreateOrganization = () => {
		setCreateOrgDialogOpen(true);
	};

	const handleCreateOrgSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isCreatingOrg || !orgName) return;
		setIsCreatingOrg(true);
		setCreateOrgError(null);

		try {
			await executeMutation({
				mutation: async () => {
					const result = await createOrganization({
						name: orgName,
						slug: derivedSlug,
						logo: orgLogo || undefined,
					});

					if (result.error || !result.data) {
						throw new Error(result.error || "Failed to create organization");
					}

					// Set as active
					const setActiveResult = await setActiveOrganization(result.data.id);
					if (setActiveResult.error) {
						// Organization created but activation failed - still return org
						// but we'll show a warning toast after success
						console.warn(
							"Organization created but failed to activate:",
							setActiveResult.error,
						);
					}

					return result.data;
				},
				loading: "Creating organization...",
				success: (org) => `${org.name} has been created and is now active.`,
				onSuccess: (org) => {
					const { addOrganization, setCurrentOrg } = useOrgStore.getState();
					addOrganization(org);
					setCurrentOrg(org);

					setCreateOrgDialogOpen(false);
					setOrgName("");
					setNewOrgSlug("");
					setOrgLogo("");
					setCreateOrgError(null);
				},
			});
		} catch {
			// Error is already handled by executeMutation via Sonner
		} finally {
			setIsCreatingOrg(false);
		}
	};

	// Convert org-store organizations to legacy format for OrganizationSwitcher
	const legacyOrganizations: LegacyOrganization[] = organizations.map(
		(org) => ({
			id: org.id,
			name: org.name,
			slug: org.slug,
			logo: org.logo ?? undefined,
		}),
	);

	const legacyActiveOrg: LegacyOrganization | null = currentOrg
		? {
				id: currentOrg.id,
				name: currentOrg.name,
				slug: currentOrg.slug,
				logo: currentOrg.logo ?? undefined,
			}
		: null;

	const user = session?.user
		? {
				name: session.user.name || "Usuario",
				email: session.user.email || "",
				avatar: session.user.image || undefined,
			}
		: null;

	return (
		<>
			<Sidebar collapsible="icon" {...props}>
				<SidebarHeader className="h-16 border-b border-sidebar-border justify-center">
					<OrganizationSwitcher
						organizations={legacyOrganizations}
						activeOrganization={legacyActiveOrg}
						onOrganizationChange={handleOrganizationChange}
						onCreateOrganization={handleCreateOrganization}
						isLoading={isPending || orgLoading}
					/>
				</SidebarHeader>

				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
							Transacción
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{mainNavItems.map((item) => {
									const Icon = item.icon;
									const isActive = isNavActive(item.href);

									return (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton
												asChild
												isActive={isActive}
												tooltip={item.title}
											>
												<Link
													href={item.available ? orgPath(item.href) : "#"}
													aria-disabled={!item.available}
													className={cn(
														!item.available && "pointer-events-none opacity-50",
													)}
													onClick={item.available ? handleLinkClick : undefined}
												>
													<Icon />
													<span>{item.title}</span>
													{!item.available && (
														<span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded group-data-[collapsible=icon]:hidden">
															Pronto
														</span>
													)}
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>

					<SidebarSeparator />

					<SidebarGroup>
						<SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
							Análisis
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{secondaryNavItems.map((item) => {
									const Icon = item.icon;
									const isActive = isNavActive(item.href);

									return (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton
												asChild
												isActive={isActive}
												tooltip={item.title}
											>
												<Link
													href={item.available ? orgPath(item.href) : "#"}
													aria-disabled={!item.available}
													className={cn(
														!item.available && "pointer-events-none opacity-50",
													)}
													onClick={item.available ? handleLinkClick : undefined}
												>
													<Icon />
													<span>{item.title}</span>
													{!item.available && (
														<span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded group-data-[collapsible=icon]:hidden">
															Pronto
														</span>
													)}
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>

					<SidebarSeparator className="mt-auto" />

					<SidebarGroup>
						<SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
							Organization
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{orgNavItems.map((item) => {
									const Icon = item.icon;
									const isActive = isNavActive(item.href);

									return (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton
												asChild
												isActive={isActive}
												tooltip={item.title}
											>
												<Link
													href={item.available ? orgPath(item.href) : "#"}
													aria-disabled={!item.available}
													className={cn(
														!item.available && "pointer-events-none opacity-50",
													)}
													onClick={item.available ? handleLinkClick : undefined}
												>
													<Icon />
													<span>{item.title}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter className="border-t border-sidebar-border">
					<NavUser user={user} isLoading={isPending} onLogout={handleLogout} />
				</SidebarFooter>

				<SidebarRail />
			</Sidebar>
			<Dialog open={createOrgDialogOpen} onOpenChange={setCreateOrgDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Nueva organización</DialogTitle>
						<DialogDescription>
							Crea una organización para gestionar tu equipo y datos.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleCreateOrgSubmit} className="space-y-4">
						{createOrgError && (
							<div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
								{createOrgError}
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="org-name">Nombre</Label>
							<Input
								id="org-name"
								value={orgName}
								onChange={(e) => {
									setOrgName(e.target.value);
									setCreateOrgError(null);
								}}
								required
								placeholder="Mi organización"
							/>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="org-slug">Slug</Label>
								<span className="text-xs text-muted-foreground">
									Usado en la URL
								</span>
							</div>
							<Input
								id="org-slug"
								value={newOrgSlug}
								onChange={(e) => {
									setNewOrgSlug(e.target.value);
									setCreateOrgError(null);
								}}
								placeholder="mi-organizacion"
							/>
							<p className="text-xs text-muted-foreground">
								Slug final:{" "}
								<span className="font-medium">{derivedSlug || "..."}</span>
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="org-logo">Logo (URL opcional)</Label>
							<Input
								id="org-logo"
								value={orgLogo}
								onChange={(e) => setOrgLogo(e.target.value)}
								placeholder="https://example.com/logo.png"
							/>
						</div>
						<Separator />
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setCreateOrgDialogOpen(false)}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isCreatingOrg || !orgName}>
								{isCreatingOrg ? "Creando..." : "Crear organización"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}

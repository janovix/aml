"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
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
		title: "Avisos",
		href: "/alertas",
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
		href: "/reportes",
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
	const { isMobile, setOpenMobile } = useSidebar();
	const { data: session, isPending } = useAuthSession();
	const { toast } = useToast();

	// Use org-store for organization state
	const {
		currentOrg,
		organizations,
		setCurrentOrg,
		isLoading: orgLoading,
	} = useOrgStore();

	const handleLinkClick = React.useCallback(() => {
		if (isMobile) {
			setOpenMobile(false);
		}
	}, [isMobile, setOpenMobile]);

	const handleLogout = async () => {
		await logout();
	};

	const handleOrganizationChange = async (org: LegacyOrganization) => {
		const result = await setActiveOrganization(org.id);
		if (result.error) {
			toast({
				variant: "destructive",
				title: "Failed to switch organization",
				description: result.error,
			});
		} else {
			const fullOrg = organizations.find((o) => o.id === org.id);
			if (fullOrg) {
				setCurrentOrg(fullOrg);
				toast({
					title: "Organization switched",
					description: `${fullOrg.name} is now active.`,
				});
			}
		}
	};

	const [createOrgDialogOpen, setCreateOrgDialogOpen] = React.useState(false);
	const [orgName, setOrgName] = React.useState("");
	const [orgSlug, setOrgSlug] = React.useState("");
	const [orgLogo, setOrgLogo] = React.useState("");
	const [isCreatingOrg, setIsCreatingOrg] = React.useState(false);
	const [createOrgError, setCreateOrgError] = React.useState<string | null>(
		null,
	);

	const derivedSlug = React.useMemo(
		() => (orgSlug ? slugify(orgSlug) : slugify(orgName)),
		[orgName, orgSlug],
	);

	const handleCreateOrganization = () => {
		setCreateOrgDialogOpen(true);
	};

	const handleCreateOrgSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isCreatingOrg || !orgName) return;
		setIsCreatingOrg(true);
		setCreateOrgError(null);

		const result = await createOrganization({
			name: orgName,
			slug: derivedSlug,
			logo: orgLogo || undefined,
		});

		if (result.error || !result.data) {
			setCreateOrgError(result.error || "Please try again later.");
			setIsCreatingOrg(false);
			return;
		}

		// Add to store
		const { addOrganization, setCurrentOrg } = useOrgStore.getState();
		addOrganization(result.data);
		setCurrentOrg(result.data);

		// Set as active
		const setActiveResult = await setActiveOrganization(result.data.id);
		if (setActiveResult.error) {
			toast({
				variant: "destructive",
				title: "Organization created but failed to activate",
				description: setActiveResult.error,
			});
		} else {
			toast({
				title: "Organization created",
				description: `${result.data.name} has been created and is now active.`,
			});
		}

		setCreateOrgDialogOpen(false);
		setOrgName("");
		setOrgSlug("");
		setOrgLogo("");
		setCreateOrgError(null);
		setIsCreatingOrg(false);
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
				<SidebarHeader className="border-b border-sidebar-border">
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
									const isActive =
										pathname === item.href ||
										pathname?.startsWith(`${item.href}/`);

									return (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton
												asChild
												isActive={isActive}
												tooltip={item.title}
											>
												<Link
													href={item.available ? item.href : "#"}
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
									const isActive =
										pathname === item.href ||
										pathname?.startsWith(`${item.href}/`);

									return (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton
												asChild
												isActive={isActive}
												tooltip={item.title}
											>
												<Link
													href={item.available ? item.href : "#"}
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
									const isActive =
										pathname === item.href ||
										pathname?.startsWith(`${item.href}/`);

									return (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton
												asChild
												isActive={isActive}
												tooltip={item.title}
											>
												<Link
													href={item.available ? item.href : "#"}
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
								value={orgSlug}
								onChange={(e) => {
									setOrgSlug(e.target.value);
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

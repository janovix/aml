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
	OrganizationSwitcher,
	type Organization,
} from "./OrganizationSwitcher";
import { NavUser } from "./NavUser";

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
		available: false,
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
		available: false,
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

const bottomNavItems = [
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

	// TODO: Replace with actual organization data from auth client
	// This will be populated from better-auth organization plugin
	const [organizations] = React.useState<Organization[]>([]);
	const [activeOrganization] = React.useState<Organization | null>(null);

	const handleLinkClick = React.useCallback(() => {
		if (isMobile) {
			setOpenMobile(false);
		}
	}, [isMobile, setOpenMobile]);

	const handleLogout = async () => {
		await logout();
	};

	const handleOrganizationChange = async (org: Organization) => {
		// TODO: Call better-auth setActiveOrganization and refresh JWT
		console.log("Switching to organization:", org.id);
		// This will trigger a session refresh with the new organization
	};

	const handleCreateOrganization = () => {
		// TODO: Navigate to organization creation page or open modal
		router.push("/settings/organizations/new");
	};

	const user = session?.user
		? {
				name: session.user.name || "Usuario",
				email: session.user.email || "",
				avatar: session.user.image || undefined,
			}
		: null;

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader className="border-b border-sidebar-border">
				<OrganizationSwitcher
					organizations={organizations}
					activeOrganization={activeOrganization}
					onOrganizationChange={handleOrganizationChange}
					onCreateOrganization={handleCreateOrganization}
					isLoading={isPending}
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
					<SidebarGroupContent>
						<SidebarMenu>
							{bottomNavItems.map((item) => {
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
	);
}

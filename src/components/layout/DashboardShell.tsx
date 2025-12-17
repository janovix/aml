"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import {
	Users,
	AlertTriangle,
	FileText,
	Settings,
	BarChart3,
	Shield,
	Database,
	Clock,
	Briefcase,
} from "lucide-react";
import { ThemeSwitcher } from "@algtools/ui";
import { cn } from "@/lib/utils";

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
		href: "/configuracion",
		icon: Settings,
		available: false,
	},
];

interface DashboardShellProps {
	children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
	const pathname = usePathname();

	return (
		<SidebarProvider defaultOpen={true}>
			<Sidebar collapsible="icon" variant="sidebar">
				<SidebarHeader className="border-b border-sidebar-border">
					<div className="flex h-16 items-center gap-2 px-4">
						<Shield className="h-7 w-7 text-primary" />
						<SidebarGroupLabel className="text-lg font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
							AML Platform
						</SidebarGroupLabel>
					</div>
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
				</SidebarContent>
				<SidebarFooter className="border-t border-sidebar-border">
					<SidebarMenu>
						{bottomNavItems.map((item) => {
							const Icon = item.icon;
							const isActive =
								pathname === item.href || pathname?.startsWith(`${item.href}/`);

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
										>
											<Icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarFooter>
				<SidebarRail />
			</Sidebar>
			<SidebarInset>
				<header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
					<SidebarTrigger className="-ml-1" />
					<div className="flex flex-1 items-center justify-end gap-2">
						<ThemeSwitcher />
					</div>
				</header>
				<main className="flex flex-1 flex-col overflow-auto">
					<div className="flex-1 p-4 md:p-6 lg:p-8">{children}</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

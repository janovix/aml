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
	Database,
	Clock,
	Briefcase,
	User,
	LogOut,
} from "lucide-react";
import { ThemeSwitcher } from "@algtools/ui";
import { cn } from "@/lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { useSidebar } from "@/components/ui/sidebar";

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

interface DashboardLayoutProps {
	children: React.ReactNode;
}

function SidebarLogo() {
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";

	return (
		<div className="flex h-16 items-center justify-center px-4">
			{isCollapsed ? (
				<Logo variant="icon" width={32} height={32} className="shrink-0" />
			) : (
				<Logo variant="logo" width={102} height={16} className="shrink-0" />
			)}
		</div>
	);
}

function Navbar() {
	const [isScrollingDown, setIsScrollingDown] = React.useState(false);
	const [lastScrollY, setLastScrollY] = React.useState(0);

	React.useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			if (currentScrollY > lastScrollY && currentScrollY > 10) {
				setIsScrollingDown(true);
			} else {
				setIsScrollingDown(false);
			}
			setLastScrollY(currentScrollY);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [lastScrollY]);

	return (
		<header
			className={cn(
				"sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-transform duration-300",
				isScrollingDown ? "-translate-y-full" : "translate-y-0",
			)}
		>
			<SidebarTrigger className="-ml-1" />
			<div className="flex flex-1 items-center justify-end gap-2">
				<ThemeSwitcher />
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="rounded-full">
							<div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
								<User className="h-4 w-4" />
							</div>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-56" align="end" forceMount>
						<DropdownMenuLabel className="font-normal">
							<div className="flex flex-col space-y-1">
								<p className="text-sm font-medium leading-none">Usuario</p>
								<p className="text-xs leading-none text-muted-foreground">
									usuario@ejemplo.com
								</p>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link
								href="/configuracion"
								className="flex items-center cursor-pointer"
							>
								<Settings className="mr-2 h-4 w-4" />
								<span>Configuración</span>
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem className="cursor-pointer">
							<LogOut className="mr-2 h-4 w-4" />
							<span>Cerrar sesión</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
	const pathname = usePathname();

	return (
		<SidebarProvider defaultOpen={true}>
			<Sidebar collapsible="icon" variant="sidebar">
				<SidebarHeader className="border-b border-sidebar-border h-16 p-0">
					<SidebarLogo />
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
				<Navbar />
				<main className="flex flex-1 flex-col overflow-auto">
					<div className="flex-1 p-4 md:p-6 lg:p-8">{children}</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

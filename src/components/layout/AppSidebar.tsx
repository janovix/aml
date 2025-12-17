"use client";

import type React from "react";
import {
	Button,
	ScrollArea,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	cn,
} from "@algtools/ui";
import {
	Users,
	AlertTriangle,
	FileText,
	Settings,
	BarChart3,
	Shield,
	ChevronLeft,
	ChevronRight,
	Database,
	Clock,
	Briefcase,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppSidebarProps {
	collapsed: boolean;
	onToggle: () => void;
	isMobile?: boolean;
}

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

export function AppSidebar({
	collapsed,
	onToggle,
	isMobile = false,
}: AppSidebarProps): React.ReactElement {
	const pathname = usePathname();

	const NavItem = ({
		item,
	}: {
		item: {
			title: string;
			href: string;
			icon: React.ComponentType<{ className?: string }>;
			available: boolean;
		};
	}): React.ReactElement => {
		const isActive =
			pathname === item.href || pathname?.startsWith(`${item.href}/`);
		const Icon = item.icon;
		const isCollapsed = isMobile ? false : collapsed;

		const content = (
			<Link
				href={item.available ? item.href : "#"}
				onClick={isMobile ? onToggle : undefined}
				className={cn(
					"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
					isActive
						? "bg-primary text-primary-foreground shadow-sm"
						: item.available
							? "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
							: "cursor-not-allowed text-muted-foreground/50",
					isCollapsed && "justify-center px-2",
				)}
				aria-current={isActive ? "page" : undefined}
				aria-disabled={!item.available}
			>
				<Icon
					className={cn(
						"h-5 w-5 shrink-0",
						isActive && "text-primary-foreground",
					)}
				/>
				{!isCollapsed && <span className="truncate">{item.title}</span>}
				{!isCollapsed && !item.available && (
					<span className="ml-auto text-xs text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
						Pronto
					</span>
				)}
			</Link>
		);

		if (isCollapsed) {
			return (
				<Tooltip delayDuration={0}>
					<TooltipTrigger asChild>{content}</TooltipTrigger>
					<TooltipContent side="right" className="flex items-center gap-2">
						{item.title}
						{!item.available && (
							<span className="text-xs text-muted-foreground">
								(Próximamente)
							</span>
						)}
					</TooltipContent>
				</Tooltip>
			);
		}

		return content;
	};

	if (isMobile) {
		return (
			<TooltipProvider>
				<ScrollArea className="flex-1 px-3 py-4">
					<nav className="flex flex-col gap-1">
						{/* Main Navigation */}
						<div className="space-y-1">
							<p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Transacción
							</p>
							{mainNavItems.map((item) => (
								<NavItem key={item.href} item={item} />
							))}
						</div>

						{/* Divider */}
						<div className="my-4 h-px bg-border" />

						{/* Secondary Navigation */}
						<div className="space-y-1">
							<p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Análisis
							</p>
							{secondaryNavItems.map((item) => (
								<NavItem key={item.href} item={item} />
							))}
						</div>
					</nav>
				</ScrollArea>

				{/* Bottom section */}
				<div className="mt-auto border-t p-3 space-y-1">
					{bottomNavItems.map((item) => (
						<NavItem key={item.href} item={item} />
					))}
				</div>
			</TooltipProvider>
		);
	}

	return (
		<TooltipProvider>
			<aside
				className={cn(
					"sticky top-0 z-20 flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
					collapsed ? "w-16" : "w-64",
					"hidden lg:flex",
				)}
			>
				{/* Logo */}
				<div className="flex h-16 items-center justify-between border-b px-4">
					{!collapsed && (
						<div className="flex items-center gap-2">
							<Shield className="h-7 w-7 text-primary" />
							<span className="text-lg font-bold text-foreground">
								AML Platform
							</span>
						</div>
					)}
					{collapsed && <Shield className="mx-auto h-7 w-7 text-primary" />}
				</div>

				{/* Navigation */}
				<ScrollArea className="flex-1 px-3 py-4">
					<nav className="flex flex-col gap-1">
						{/* Main Navigation */}
						<div className="space-y-1">
							{!collapsed && (
								<p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Transacción
								</p>
							)}
							{mainNavItems.map((item) => (
								<NavItem key={item.href} item={item} />
							))}
						</div>

						{/* Divider */}
						<div className="my-4 h-px bg-border" />

						{/* Secondary Navigation */}
						<div className="space-y-1">
							{!collapsed && (
								<p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Análisis
								</p>
							)}
							{secondaryNavItems.map((item) => (
								<NavItem key={item.href} item={item} />
							))}
						</div>
					</nav>
				</ScrollArea>

				{/* Bottom section */}
				<div className="mt-auto border-t p-3 space-y-1">
					{bottomNavItems.map((item) => (
						<NavItem key={item.href} item={item} />
					))}

					{/* Collapse toggle */}
					<Button
						variant="ghost"
						size="sm"
						onClick={onToggle}
						className={cn(
							"w-full justify-center text-muted-foreground hover:text-foreground",
							!collapsed && "justify-start gap-3 px-3",
						)}
						aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
					>
						{collapsed ? (
							<ChevronRight className="h-4 w-4" />
						) : (
							<>
								<ChevronLeft className="h-4 w-4" />
								<span>Colapsar</span>
							</>
						)}
					</Button>
				</div>
			</aside>
		</TooltipProvider>
	);
}

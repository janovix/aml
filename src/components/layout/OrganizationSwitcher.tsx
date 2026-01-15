"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Settings } from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatProperNoun } from "@/lib/utils";
import { getAuthAppUrl } from "@/lib/auth/config";

export interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string;
}

interface OrganizationSwitcherProps {
	organizations: Organization[];
	activeOrganization: Organization | null;
	onOrganizationChange: (organization: Organization) => void;
	onCreateOrganization?: () => void;
	isLoading?: boolean;
	organizationsOwned?: number;
	organizationsLimit?: number;
}

// Small circular progress indicator
function CircularProgress({
	value,
	max,
	size = 20,
}: {
	value: number;
	max: number;
	size?: number;
}) {
	const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
	const strokeWidth = 2.5;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = circumference - (percentage / 100) * circumference;

	// Color based on usage
	const getColor = () => {
		if (percentage >= 100) return "text-destructive";
		if (percentage >= 80) return "text-yellow-500";
		return "text-primary";
	};

	return (
		<svg
			width={size}
			height={size}
			className={`-rotate-90 ${getColor()}`}
			viewBox={`0 0 ${size} ${size}`}
		>
			{/* Background circle */}
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				className="opacity-20"
			/>
			{/* Progress circle */}
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeDasharray={circumference}
				strokeDashoffset={strokeDashoffset}
				strokeLinecap="round"
			/>
		</svg>
	);
}

function getOrgInitials(name: string): string {
	const parts = name.split(" ").filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
	return (
		parts[0].charAt(0).toUpperCase() +
		parts[parts.length - 1].charAt(0).toUpperCase()
	);
}

export function OrganizationSwitcher({
	organizations,
	activeOrganization,
	onOrganizationChange,
	onCreateOrganization,
	isLoading = false,
	organizationsOwned = 0,
	organizationsLimit = 0,
}: OrganizationSwitcherProps) {
	const { isMobile, state } = useSidebar();
	const isCollapsed = state === "collapsed";

	if (isLoading) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="lg" className="animate-pulse">
						<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted" />
						<div className="grid flex-1 gap-1">
							<div className="h-4 w-24 rounded bg-muted" />
							<div className="h-3 w-16 rounded bg-muted" />
						</div>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	// If collapsed, show just the org avatar with dropdown
	if (isCollapsed) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="justify-center data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								<div className="flex items-center justify-center">
									{activeOrganization?.logo ? (
										<img
											src={activeOrganization.logo}
											alt={activeOrganization.name}
											className="size-8 rounded-lg object-cover"
										/>
									) : (
										<div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
											{activeOrganization
												? getOrgInitials(activeOrganization.name)
												: "?"}
										</div>
									)}
								</div>
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="min-w-56 rounded-lg"
							align="start"
							side="right"
							sideOffset={4}
						>
							<DropdownMenuLabel className="flex items-center justify-between text-xs text-muted-foreground">
								<span>Organizaciones</span>
								{organizationsLimit > 0 && (
									<div className="flex items-center gap-1.5">
										<CircularProgress
											value={organizationsOwned}
											max={organizationsLimit}
											size={16}
										/>
										<span className="tabular-nums">
											{organizationsOwned}/{organizationsLimit}
										</span>
									</div>
								)}
							</DropdownMenuLabel>
							{organizations.map((org) => (
								<DropdownMenuItem
									key={org.id}
									onClick={() => onOrganizationChange(org)}
									className="gap-2 p-2 group/org"
								>
									{org.logo ? (
										<img
											src={org.logo}
											alt={org.name}
											className="size-6 rounded-md object-cover"
										/>
									) : (
										<div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold">
											{getOrgInitials(org.name)}
										</div>
									)}
									<span className="flex-1 truncate">
										{formatProperNoun(org.name)}
									</span>
									{activeOrganization?.id === org.id && (
										<span className="text-xs text-muted-foreground group-hover/org:hidden">
											Activa
										</span>
									)}
									<Tooltip>
										<TooltipTrigger asChild>
											<a
												href={`${getAuthAppUrl()}/settings/organization?org=${org.slug}`}
												onClick={(e) => e.stopPropagation()}
												className="p-1 rounded hover:bg-muted hidden group-hover/org:block"
												target="_blank"
												rel="noopener noreferrer"
											>
												<Settings className="size-3.5 text-muted-foreground" />
											</a>
										</TooltipTrigger>
										<TooltipContent side="right">Configuración</TooltipContent>
									</Tooltip>
								</DropdownMenuItem>
							))}
							{onCreateOrganization && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="gap-2 p-2"
										onClick={onCreateOrganization}
									>
										<Plus className="size-4" />
										<span className="text-muted-foreground font-medium">
											Crear organización
										</span>
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	// No organizations yet
	if (organizations.length === 0) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						size="lg"
						onClick={onCreateOrganization}
						className="border border-dashed"
					>
						<div className="flex aspect-square size-8 items-center justify-center rounded-lg border bg-transparent">
							<Plus className="size-4" />
						</div>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">Crear organización</span>
							<span className="truncate text-xs text-muted-foreground">
								Configura tu empresa
							</span>
						</div>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div className="flex items-center justify-center shrink-0">
								{activeOrganization?.logo ? (
									<img
										src={activeOrganization.logo}
										alt={activeOrganization.name}
										className="size-8 rounded-lg object-cover"
									/>
								) : (
									<div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
										{activeOrganization
											? getOrgInitials(activeOrganization.name)
											: "?"}
									</div>
								)}
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{activeOrganization?.name
										? formatProperNoun(activeOrganization.name)
										: "Seleccionar"}
								</span>
								<span className="truncate text-xs text-muted-foreground">
									{activeOrganization?.slug ?? "organización"}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="flex items-center justify-between text-xs text-muted-foreground">
							<span>Organizaciones</span>
							{organizationsLimit > 0 && (
								<div className="flex items-center gap-1.5">
									<CircularProgress
										value={organizationsOwned}
										max={organizationsLimit}
										size={16}
									/>
									<span className="tabular-nums">
										{organizationsOwned}/{organizationsLimit}
									</span>
								</div>
							)}
						</DropdownMenuLabel>
						{organizations.map((org) => (
							<DropdownMenuItem
								key={org.id}
								onClick={() => onOrganizationChange(org)}
								className="gap-2 p-2 group/org"
							>
								{org.logo ? (
									<img
										src={org.logo}
										alt={org.name}
										className="size-6 rounded-md object-cover"
									/>
								) : (
									<div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold">
										{getOrgInitials(org.name)}
									</div>
								)}
								<span className="flex-1 truncate">
									{formatProperNoun(org.name)}
								</span>
								{activeOrganization?.id === org.id && (
									<span className="text-xs text-muted-foreground group-hover/org:hidden">
										Activa
									</span>
								)}
								<Tooltip>
									<TooltipTrigger asChild>
										<a
											href={`${getAuthAppUrl()}/settings/organization?org=${org.slug}`}
											onClick={(e) => e.stopPropagation()}
											className="p-1 rounded hover:bg-muted hidden group-hover/org:block"
											target="_blank"
											rel="noopener noreferrer"
										>
											<Settings className="size-3.5 text-muted-foreground" />
										</a>
									</TooltipTrigger>
									<TooltipContent side="right">Configuración</TooltipContent>
								</Tooltip>
							</DropdownMenuItem>
						))}
						{onCreateOrganization && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="gap-2 p-2"
									onClick={onCreateOrganization}
								>
									<Plus className="size-4" />
									<span className="text-muted-foreground font-medium">
										Crear organización
									</span>
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

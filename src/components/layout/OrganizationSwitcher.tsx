"use client";

import * as React from "react";
import { Building2, ChevronsUpDown, Plus } from "lucide-react";

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
import { Logo } from "./Logo";

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
}

export function OrganizationSwitcher({
	organizations,
	activeOrganization,
	onOrganizationChange,
	onCreateOrganization,
	isLoading = false,
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

	// If collapsed, show just the logo
	if (isCollapsed) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="lg" className="justify-center" asChild>
						<div className="flex items-center justify-center">
							<Logo variant="icon" width={24} height={24} />
						</div>
					</SidebarMenuButton>
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
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
								{activeOrganization?.logo ? (
									<img
										src={activeOrganization.logo}
										alt={activeOrganization.name}
										className="size-5 rounded"
									/>
								) : (
									<Building2 className="size-4" />
								)}
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{activeOrganization?.name ?? "Seleccionar"}
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
						<DropdownMenuLabel className="text-xs text-muted-foreground">
							Organizaciones
						</DropdownMenuLabel>
						{organizations.map((org) => (
							<DropdownMenuItem
								key={org.id}
								onClick={() => onOrganizationChange(org)}
								className="gap-2 p-2"
							>
								<div className="flex size-6 items-center justify-center rounded-md border">
									{org.logo ? (
										<img
											src={org.logo}
											alt={org.name}
											className="size-4 rounded"
										/>
									) : (
										<Building2 className="size-3.5 shrink-0" />
									)}
								</div>
								<span className="flex-1 truncate">{org.name}</span>
								{activeOrganization?.id === org.id && (
									<span className="text-xs text-muted-foreground">Activa</span>
								)}
							</DropdownMenuItem>
						))}
						{onCreateOrganization && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="gap-2 p-2"
									onClick={onCreateOrganization}
								>
									<div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
										<Plus className="size-4" />
									</div>
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

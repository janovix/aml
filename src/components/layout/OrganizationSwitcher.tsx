"use client";

import * as React from "react";
import { ChevronsUpDown, Lock, Plus, Settings } from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
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
import { useLanguage } from "@/components/LanguageProvider";
import {
	BLOCKS_DATA_ENVIRONMENTS,
	EnvironmentDot,
	EnvironmentMiniBadge,
	getEnvironmentLabel,
	useEnvironmentContext,
	type EnvironmentSwitcherLabels,
} from "@algenium/blocks";

export interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string;
	role?: string;
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

interface OrgItemProps {
	org: Organization;
	onOrganizationChange: (org: Organization) => void;
}

function OrgItem({ org, onOrganizationChange }: OrgItemProps) {
	const { t } = useLanguage();
	return (
		<DropdownMenuItem
			key={org.id}
			onClick={() => onOrganizationChange(org)}
			className="gap-2 p-2"
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
			<span className="flex-1 truncate">{formatProperNoun(org.name)}</span>
			<Tooltip>
				<TooltipTrigger asChild>
					<a
						href={`${getAuthAppUrl()}/settings/organization?org=${org.slug}`}
						onClick={(e) => e.stopPropagation()}
						className="p-1 rounded hover:bg-muted"
					>
						<Settings className="size-3.5 text-muted-foreground" />
					</a>
				</TooltipTrigger>
				<TooltipContent side="right">{t("orgSettings")}</TooltipContent>
			</Tooltip>
		</DropdownMenuItem>
	);
}

interface CreateOrgItemProps {
	canCreate: boolean;
	onCreateOrganization: () => void;
}

function DataEnvironmentSubmenu() {
	const envCtx = useEnvironmentContext();
	const { t } = useLanguage();

	if (!envCtx?.setEnvironment) {
		return null;
	}

	const environments = envCtx.environments ?? [...BLOCKS_DATA_ENVIRONMENTS];
	const fullLabels: Required<EnvironmentSwitcherLabels> = {
		environment: t("envDataPlane"),
		live: t("envLive"),
		staging: t("envStaging"),
		development: t("envDevelopment"),
	};

	return (
		<>
			<DropdownMenuSeparator />
			<DropdownMenuSub>
				<DropdownMenuSubTrigger className="gap-2">
					<span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
						<span className="truncate text-muted-foreground">
							{t("envDataPlane")}
						</span>
						<EnvironmentMiniBadge abbreviated />
					</span>
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent>
					{environments.map((env) => (
						<DropdownMenuItem
							key={env}
							data-testid={`org-switcher-env-${env}`}
							className="gap-2 cursor-pointer"
							onSelect={() => {
								envCtx.setEnvironment(env);
							}}
						>
							<EnvironmentDot env={env} size="sm" />
							<span>{getEnvironmentLabel(env, fullLabels)}</span>
						</DropdownMenuItem>
					))}
				</DropdownMenuSubContent>
			</DropdownMenuSub>
		</>
	);
}

function CreateOrgItem({
	canCreate,
	onCreateOrganization,
}: CreateOrgItemProps) {
	const { t } = useLanguage();

	if (canCreate) {
		return (
			<DropdownMenuItem className="gap-2 p-2" onClick={onCreateOrganization}>
				<Plus className="size-4" />
				<span className="text-muted-foreground font-medium">
					{t("createOrganization")}
				</span>
			</DropdownMenuItem>
		);
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="flex items-center gap-2 p-2 rounded-sm text-sm opacity-50 cursor-not-allowed select-none">
					<Lock className="size-4" />
					<span className="text-muted-foreground font-medium">
						{t("createOrganization")}
					</span>
				</div>
			</TooltipTrigger>
			<TooltipContent side="right">{t("orgLimitReached")}</TooltipContent>
		</Tooltip>
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
	const { t } = useLanguage();
	const envCtx = useEnvironmentContext();
	const dataEnv = envCtx?.environment ?? "production";

	const ownedOrgs = organizations.filter((o) => o.role === "owner");
	const memberOrgs = organizations.filter((o) => o.role !== "owner");
	const canCreate =
		organizationsLimit === 0 || organizationsOwned < organizationsLimit;

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

	// If collapsed (and not on mobile), show just the org avatar with dropdown
	if (isCollapsed && !isMobile) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="justify-center data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								<div className="relative flex items-center justify-center">
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
									{envCtx?.setEnvironment ? (
										<span className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-sidebar ring-2 ring-sidebar">
											<EnvironmentDot env={dataEnv} size="xs" />
										</span>
									) : null}
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
								<span>{t("organizations")}</span>
								<div className="flex items-center gap-1.5">
									{organizationsLimit > 0 && (
										<CircularProgress
											value={organizationsOwned}
											max={organizationsLimit}
											size={16}
										/>
									)}
									<span className="tabular-nums">
										{organizationsOwned}/
										{organizationsLimit === 0 ? "∞" : organizationsLimit}
									</span>
								</div>
							</DropdownMenuLabel>

							{/* Owned organizations */}
							{(ownedOrgs.length > 0 || onCreateOrganization) && (
								<DropdownMenuGroup>
									{ownedOrgs.length > 0 && (
										<DropdownMenuLabel className="text-xs text-muted-foreground/70 font-normal px-2 py-1">
											{t("myOrganizations")}
										</DropdownMenuLabel>
									)}
									{ownedOrgs.map((org) => (
										<OrgItem
											key={org.id}
											org={org}
											onOrganizationChange={onOrganizationChange}
										/>
									))}
									{onCreateOrganization && (
										<CreateOrgItem
											canCreate={canCreate}
											onCreateOrganization={onCreateOrganization}
										/>
									)}
								</DropdownMenuGroup>
							)}

							{/* Member-of organizations */}
							{memberOrgs.length > 0 && (
								<>
									{(ownedOrgs.length > 0 || onCreateOrganization) && (
										<DropdownMenuSeparator />
									)}
									<DropdownMenuGroup>
										<DropdownMenuLabel className="text-xs text-muted-foreground/70 font-normal px-2 py-1">
											{t("memberOf")}
										</DropdownMenuLabel>
										{memberOrgs.map((org) => (
											<OrgItem
												key={org.id}
												org={org}
												onOrganizationChange={onOrganizationChange}
											/>
										))}
									</DropdownMenuGroup>
								</>
							)}

							{/* Fallback: show all orgs without grouping if no roles available */}
							{ownedOrgs.length === 0 &&
								memberOrgs.length === 0 &&
								organizations.map((org) => (
									<OrgItem
										key={org.id}
										org={org}
										onOrganizationChange={onOrganizationChange}
									/>
								))}
							<DataEnvironmentSubmenu />
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
							<span className="truncate font-medium">
								{t("createOrganization")}
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
							className="h-auto min-h-12 items-start py-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div className="flex size-8 shrink-0 items-center justify-center self-start pt-0.5">
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
							<div className="flex min-w-0 flex-1 gap-1.5 text-left text-sm leading-tight">
								<div className="min-w-0 flex-1 flex flex-col gap-0.5">
									<span className="truncate font-medium leading-tight">
										{activeOrganization?.name
											? formatProperNoun(activeOrganization.name)
											: t("organizations")}
									</span>
									<span className="truncate text-xs text-muted-foreground leading-tight">
										{activeOrganization?.slug ?? "organization"}
									</span>
								</div>
								<div className="flex shrink-0 flex-col items-end gap-1.5">
									<ChevronsUpDown className="mt-0.5 size-4 text-muted-foreground" />
									{envCtx?.setEnvironment && dataEnv !== "production" ? (
										<EnvironmentMiniBadge abbreviated className="w-fit" />
									) : null}
								</div>
							</div>
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="flex items-center justify-between text-xs text-muted-foreground">
							<span>{t("organizations")}</span>
							<div className="flex items-center gap-1.5">
								{organizationsLimit > 0 && (
									<CircularProgress
										value={organizationsOwned}
										max={organizationsLimit}
										size={16}
									/>
								)}
								<span className="tabular-nums">
									{organizationsOwned}/
									{organizationsLimit === 0 ? "∞" : organizationsLimit}
								</span>
							</div>
						</DropdownMenuLabel>

						{/* Owned organizations */}
						{(ownedOrgs.length > 0 || onCreateOrganization) && (
							<DropdownMenuGroup>
								{ownedOrgs.length > 0 && (
									<DropdownMenuLabel className="text-xs text-muted-foreground/70 font-normal px-2 py-1">
										{t("myOrganizations")}
									</DropdownMenuLabel>
								)}
								{ownedOrgs.map((org) => (
									<OrgItem
										key={org.id}
										org={org}
										onOrganizationChange={onOrganizationChange}
									/>
								))}
								{onCreateOrganization && (
									<CreateOrgItem
										canCreate={canCreate}
										onCreateOrganization={onCreateOrganization}
									/>
								)}
							</DropdownMenuGroup>
						)}

						{/* Member-of organizations */}
						{memberOrgs.length > 0 && (
							<>
								{(ownedOrgs.length > 0 || onCreateOrganization) && (
									<DropdownMenuSeparator />
								)}
								<DropdownMenuGroup>
									<DropdownMenuLabel className="text-xs text-muted-foreground/70 font-normal px-2 py-1">
										{t("memberOf")}
									</DropdownMenuLabel>
									{memberOrgs.map((org) => (
										<OrgItem
											key={org.id}
											org={org}
											onOrganizationChange={onOrganizationChange}
										/>
									))}
								</DropdownMenuGroup>
							</>
						)}

						{/* Fallback: show all orgs without grouping if no roles available */}
						{ownedOrgs.length === 0 &&
							memberOrgs.length === 0 &&
							organizations.map((org) => (
								<OrgItem
									key={org.id}
									org={org}
									onOrganizationChange={onOrganizationChange}
								/>
							))}
						<DataEnvironmentSubmenu />
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
	Users,
	AlertTriangle,
	FileText,
	FileWarning,
	Home,
	Briefcase,
	Settings,
	Search,
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
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuthSession } from "@/lib/auth/useAuthSession";
import { logout } from "@/lib/auth/actions";
import { setActiveOrganization } from "@/lib/auth/organizations";
import { useOrgStore, type Organization } from "@/lib/org-store";
import { executeMutation } from "@/lib/mutations";
import { useSubscriptionSafe } from "@/lib/subscription";
import {
	OrganizationSwitcher,
	type Organization as LegacyOrganization,
} from "./OrganizationSwitcher";
import { NavUser } from "./NavUser";
import { AppSwitcher } from "./AppSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { getAuthAppUrl, getWatchlistAppUrl } from "@/lib/auth/config";
import { useLanguage } from "@/components/LanguageProvider";
import type { TranslationKeys } from "@/lib/translations";

type NavItem = {
	titleKey: TranslationKeys;
	href: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	available: boolean;
	externalUrl?: string; // If set, links to external URL instead of internal href
};

const mainNavItems: NavItem[] = [
	{
		titleKey: "navDashboard",
		href: "",
		icon: Home,
		available: true,
	},
	{
		titleKey: "navClients",
		href: "/clients",
		icon: Users,
		available: true,
	},
	{
		titleKey: "navTransactions",
		href: "/transactions",
		icon: Briefcase,
		available: true,
	},
];

const complianceNavItems: NavItem[] = [
	{
		titleKey: "navAlerts",
		href: "/alerts",
		icon: AlertTriangle,
		available: true,
	},
	{
		titleKey: "navNotices",
		href: "/notices",
		icon: FileWarning,
		available: true,
	},
	{
		titleKey: "navReports",
		href: "/reports",
		icon: FileText,
		available: true,
	},
];

// Products nav items (links to other apps)
const getProductsNavItems = (): NavItem[] => [
	{
		titleKey: "navWatchlist",
		href: "/",
		icon: Search,
		available: true,
		externalUrl: getWatchlistAppUrl(),
	},
	{
		titleKey: "navSettings",
		href: "/settings",
		icon: Settings,
		available: true,
		externalUrl: getAuthAppUrl(),
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { t } = useLanguage();
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

	// Get subscription data for org limits
	const subscriptionData = useSubscriptionSafe();
	const organizationsOwned =
		subscriptionData?.subscription?.organizationsOwned ?? 0;
	const organizationsLimit =
		subscriptionData?.subscription?.organizationsLimit ?? 0;

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
			// For root/home (empty href), only match exact path
			if (itemHref === "") {
				return pathname === fullPath;
			}
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
								router.replace(`/${fullOrg.slug}`);
							}
						} else {
							// No org in URL, navigate to new org's default page
							router.replace(`/${fullOrg.slug}`);
						}
					}
				},
			});
		} catch {
			// Error is already handled by executeMutation via Sonner
		}
	};

	// Redirect to auth settings to create a new organization
	const handleCreateOrganization = () => {
		const authBaseUrl = getAuthAppUrl();
		window.location.href = `${authBaseUrl}/settings/organization/new`;
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
				name: session.user.name || t("sidebarUser"),
				email: session.user.email || "",
				avatar: session.user.image || undefined,
			}
		: null;

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader className="h-16 border-b border-sidebar-border flex items-center justify-center">
				{/* App Switcher (replaces static Logo) */}
				<AppSwitcher />
			</SidebarHeader>

			<SidebarContent>
				{/* Organization Switcher */}
				<div className="p-2 border-b border-sidebar-border">
					<OrganizationSwitcher
						organizations={legacyOrganizations}
						activeOrganization={legacyActiveOrg}
						onOrganizationChange={handleOrganizationChange}
						onCreateOrganization={handleCreateOrganization}
						isLoading={isPending || orgLoading}
						organizationsOwned={organizationsOwned}
						organizationsLimit={organizationsLimit}
					/>
				</div>

				<SidebarGroup>
					<SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
						{t("navTransaction")}
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{mainNavItems.map((item) => {
								const Icon = item.icon;
								const isActive = isNavActive(item.href);
								const title = t(item.titleKey);

								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton
											asChild
											isActive={isActive}
											tooltip={title}
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
												<span>{title}</span>
												{!item.available && (
													<span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded group-data-[collapsible=icon]:hidden">
														{t("navComingSoon")}
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

				<SidebarGroup>
					<SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
						{t("navCompliance")}
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{complianceNavItems.map((item) => {
								const Icon = item.icon;
								const isActive = isNavActive(item.href);
								const title = t(item.titleKey);

								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton
											asChild
											isActive={isActive}
											tooltip={title}
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
												<span>{title}</span>
												{!item.available && (
													<span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded group-data-[collapsible=icon]:hidden">
														{t("navComingSoon")}
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

				<SidebarGroup>
					<SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
						{t("navProducts")}
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{getProductsNavItems().map((item) => {
								const Icon = item.icon;
								const title = t(item.titleKey);

								return (
									<SidebarMenuItem key={item.titleKey}>
										<SidebarMenuButton asChild tooltip={title}>
											<a
												href={item.externalUrl}
												onClick={handleLinkClick}
												target="_blank"
												rel="noopener noreferrer"
											>
												<Icon />
												<span>{title}</span>
											</a>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-t border-sidebar-border">
				{/* Language and Theme Switchers */}
				<div className="flex items-center justify-between px-2 py-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-1">
					<LanguageSwitcher
						variant="default"
						size="sm"
						shape="rounded"
						showIcon
						side="right"
						align="start"
						className="group-data-[collapsible=icon]:hidden"
					/>
					<LanguageSwitcher
						variant="mini"
						size="sm"
						shape="rounded"
						side="right"
						align="center"
						className="hidden group-data-[collapsible=icon]:flex"
					/>
					<ThemeSwitcher
						variant="default"
						size="sm"
						shape="rounded"
						side="right"
						align="start"
						className="group-data-[collapsible=icon]:hidden"
					/>
					<ThemeSwitcher
						variant="mini"
						size="sm"
						shape="rounded"
						side="right"
						align="center"
						className="hidden group-data-[collapsible=icon]:flex"
					/>
				</div>
				<NavUser user={user} isLoading={isPending} onLogout={handleLogout} />
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}

"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "./AppSidebar";
import { NavBreadcrumb } from "./NavBreadcrumb";
import { Logo } from "./Logo";
import { UmaBadge } from "./UmaBadge";
import { NavbarClock } from "@/components/ui/navbar-clock";
import { useOrgStore, DEFAULT_ORG_SETTINGS } from "@/lib/org-store";
import {
	setSidebarCollapsed as saveSidebarCollapsed,
	getResolvedSettings,
	getUIPreferences,
} from "@/lib/settings/settingsClient";
import type { NotificationSoundType } from "@/lib/settings/types";
import { ChatProvider, ChatSidebar, NavbarChatButton } from "@/components/chat";
import { PageStatusProvider } from "@/components/PageStatusProvider";
import {
	LanguageSwitcher,
	NotificationsWidget,
	ThemeSwitcher,
} from "@algenium/blocks";
import { NotificationsProvider } from "@/contexts/notifications-context";
import { useLanguage } from "@/components/LanguageProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useParams, useRouter } from "next/navigation";
import type { Language } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { EntitlementAttributionBar } from "@/components/layout/EntitlementAttributionBar";

const NAVBAR_LANGUAGE_META = {
	en: { label: "EN", nativeName: "English" },
	es: { label: "ES", nativeName: "Español" },
} satisfies Record<Language, { label: string; nativeName: string }>;

const NAVBAR_LANGUAGES = (Object.keys(NAVBAR_LANGUAGE_META) as Language[]).map(
	(key) => ({ key, ...NAVBAR_LANGUAGE_META[key] }),
);

function isLanguage(key: string): key is Language {
	return Object.prototype.hasOwnProperty.call(NAVBAR_LANGUAGE_META, key);
}

/** Optional overrides for the dashboard header (e.g. Storybook controls). */
export interface DashboardHeaderToolbarProps {
	currentLanguage?: Language;
	onLanguageChange?: (lang: Language) => void;
	notificationSound?: boolean;
	notificationSoundType?: NotificationSoundType;
	showPulse?: boolean;
	maxVisible?: number;
}

interface DashboardLayoutProps {
	children: React.ReactNode;
	/** Initial sidebar collapsed state from server */
	initialSidebarCollapsed?: boolean;
	/** When true, hides sidebar navigation groups and the top navbar */
	hideNavigation?: boolean;
	/** Toolbar overrides for testing / Storybook */
	headerToolbar?: DashboardHeaderToolbarProps;
}

const SIDEBAR_COOKIE_NAME = "sidebar_state";

/**
 * Helper to set cookie value
 */
function setCookieValue(name: string, value: string, maxAge: number): void {
	if (typeof document === "undefined") return;
	document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
}

function DashboardHeader({
	toolbar,
}: {
	toolbar?: DashboardHeaderToolbarProps;
}) {
	const router = useRouter();
	const params = useParams();
	const orgSlug = params?.orgSlug as string | undefined;
	const {
		language: ctxLanguage,
		setLanguage: ctxSetLanguage,
		t,
	} = useLanguage();

	const language = toolbar?.currentLanguage ?? ctxLanguage;
	const setLanguage = toolbar?.onLanguageChange ?? ctxSetLanguage;

	const [internalNotificationSound, setInternalNotificationSound] =
		React.useState<boolean>(true);
	const [internalNotificationSoundType, setInternalNotificationSoundType] =
		React.useState<NotificationSoundType>("chime");

	const notificationSoundControlled = toolbar?.notificationSound !== undefined;
	const notificationSoundTypeControlled =
		toolbar?.notificationSoundType !== undefined;

	React.useEffect(() => {
		if (notificationSoundControlled && notificationSoundTypeControlled) {
			return;
		}
		async function loadNotificationPrefs() {
			try {
				const prefs = await getUIPreferences();
				if (!notificationSoundControlled) {
					setInternalNotificationSound(prefs.notificationSound ?? true);
				}
				if (!notificationSoundTypeControlled) {
					setInternalNotificationSoundType(
						prefs.notificationSoundType ?? "chime",
					);
				}
			} catch {
				// Silently fail — defaults remain
			}
		}
		loadNotificationPrefs();
	}, [notificationSoundControlled, notificationSoundTypeControlled]);

	const notificationSound =
		toolbar?.notificationSound ?? internalNotificationSound;
	const notificationSoundType =
		toolbar?.notificationSoundType ?? internalNotificationSoundType;
	const showPulse = toolbar?.showPulse ?? true;
	const maxVisible = toolbar?.maxVisible ?? 50;

	const handleNotificationClick = React.useCallback(
		(notification: { href?: string }) => {
			if (notification.href) {
				router.push(notification.href);
			}
		},
		[router],
	);

	const handleLanguageChange = React.useCallback(
		(key: string) => {
			if (isLanguage(key)) {
				setLanguage(key);
			}
		},
		[setLanguage],
	);

	return (
		<TooltipProvider delayDuration={0}>
			<header className="z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 shadow-xs">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mx-2 h-6" />
				<div className="flex-1 min-w-0">
					<NavBreadcrumb />
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<LanguageSwitcher
						languages={NAVBAR_LANGUAGES}
						currentLanguage={language}
						onLanguageChange={handleLanguageChange}
						labels={{ language: t("languageLabel") }}
						variant="mini"
						size="sm"
						shape="rounded"
						side="bottom"
						align="end"
					/>
					<ThemeSwitcher
						variant="mini"
						size="sm"
						shape="rounded"
						side="bottom"
						align="end"
						labels={{
							theme: t("themeLabel"),
							system: t("themeSystem"),
							light: t("themeLight"),
							dark: t("themeDark"),
						}}
					/>
					<NotificationsWidget
						onNotificationClick={handleNotificationClick}
						size="md"
						maxVisible={maxVisible}
						playSound={notificationSound}
						showPulse={showPulse}
						soundType={notificationSoundType}
						pulseStyle="ring"
						soundCooldown={60_000}
						viewAllHref={orgSlug ? `/${orgSlug}/activity` : "/activity"}
						viewAllLabel={t("activityViewAll")}
					/>
					<NavbarChatButton />
				</div>
			</header>
		</TooltipProvider>
	);
}

function Navbar({ toolbar }: { toolbar?: DashboardHeaderToolbarProps }) {
	return <DashboardHeader toolbar={toolbar} />;
}

function DashboardFooter() {
	const { state, isMobile } = useSidebar();
	/** Icon rail: NavUser is size-8 (2rem), expanded is h-12 (3rem); SidebarFooter keeps p-2. */
	const iconRail = state === "collapsed" && !isMobile;

	const currentOrg = useOrgStore((state) => state.currentOrg);
	const orgTimezone =
		currentOrg?.settings?.timezone || DEFAULT_ORG_SETTINGS.timezone;
	const [effectiveTimezone, setEffectiveTimezone] =
		React.useState<string>(orgTimezone);
	const [effectiveClockFormat, setEffectiveClockFormat] = React.useState<
		"12h" | "24h"
	>("12h");

	// Load effective settings (user > org > browser > default)
	React.useEffect(() => {
		async function loadEffectiveSettings() {
			try {
				const resolvedSettings = await getResolvedSettings();
				if (resolvedSettings?.timezone) {
					setEffectiveTimezone(resolvedSettings.timezone);
				}
				if (resolvedSettings?.clockFormat) {
					setEffectiveClockFormat(resolvedSettings.clockFormat);
				}
			} catch {
				// Fall back to org timezone
				setEffectiveTimezone(orgTimezone);
			}
		}
		loadEffectiveSettings();
	}, [orgTimezone]);

	// Listen for timezone changes from settings UI
	React.useEffect(() => {
		const handleTimezoneChange = (event: Event) => {
			const customEvent = event as CustomEvent<{ timezone: string }>;
			setEffectiveTimezone(customEvent.detail.timezone);
		};

		window.addEventListener("timezone-change", handleTimezoneChange);
		return () => {
			window.removeEventListener("timezone-change", handleTimezoneChange);
		};
	}, []);

	// Listen for clock format changes from settings UI
	React.useEffect(() => {
		const handleClockFormatChange = (event: Event) => {
			const customEvent = event as CustomEvent<{ clockFormat: "12h" | "24h" }>;
			setEffectiveClockFormat(customEvent.detail.clockFormat);
		};

		window.addEventListener("clock-format-change", handleClockFormatChange);
		return () => {
			window.removeEventListener(
				"clock-format-change",
				handleClockFormatChange,
			);
		};
	}, []);

	// Match SidebarFooter + NavUser: p-2 + row + border-t (sidebar.tsx menu button lg).
	// Narrow: stacked fineprint + actions row; sm+: single row (fineprint | clock + UMA + logo).
	return (
		<footer
			className={cn(
				"box-border flex shrink-0 flex-col gap-2 border-t border-sidebar-border px-4 py-2",
				"sm:flex-row sm:items-center sm:justify-between sm:gap-4",
			)}
		>
			<div className="min-w-0 sm:flex-1">
				<EntitlementAttributionBar className="text-center sm:text-start" />
			</div>
			<div
				className={cn(
					"flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-4",
				)}
			>
				<div
					className={cn(
						"flex items-center gap-2 overflow-hidden",
						iconRail ? "min-h-8 max-h-8" : "min-h-12 max-h-12",
					)}
				>
					<NavbarClock
						timezone={effectiveTimezone}
						defaultFormat={effectiveClockFormat}
						size="sm"
						showTimezoneMismatch={true}
					/>
					<UmaBadge />
				</div>
				<Logo
					variant="logo"
					className={cn("opacity-40", iconRail ? "max-h-6" : "max-h-8")}
				/>
			</div>
		</footer>
	);
}

export function DashboardLayout({
	children,
	initialSidebarCollapsed = false,
	hideNavigation = false,
	headerToolbar,
}: DashboardLayoutProps) {
	// Sidebar state - initialized with server-side value
	const [isCollapsed, setIsCollapsed] = useState(initialSidebarCollapsed);
	const pendingSave = useRef<boolean | null>(null);
	const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Debounced save to server
	const saveToServer = useCallback(async (collapsed: boolean) => {
		try {
			await saveSidebarCollapsed(collapsed);
		} catch {
			console.debug("[DashboardLayout] Failed to save sidebar state to server");
		}
	}, []);

	const handleSidebarOpenChange = useCallback(
		(open: boolean) => {
			const collapsed = !open;
			setIsCollapsed(collapsed);

			// Update cookie for fast reload
			setCookieValue(
				SIDEBAR_COOKIE_NAME,
				collapsed ? "false" : "true",
				60 * 60 * 24 * 7,
			);

			// Track pending save
			pendingSave.current = collapsed;

			// Clear existing timeout
			if (saveTimeout.current) {
				clearTimeout(saveTimeout.current);
			}

			// Debounce save to server (300ms)
			saveTimeout.current = setTimeout(() => {
				if (pendingSave.current !== null) {
					saveToServer(pendingSave.current);
					pendingSave.current = null;
				}
			}, 300);
		},
		[saveToServer],
	);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (saveTimeout.current) {
				clearTimeout(saveTimeout.current);
				// Save pending state immediately on unmount
				if (pendingSave.current !== null) {
					saveSidebarCollapsed(pendingSave.current).catch(() => {
						// Ignore errors on unmount
					});
				}
			}
		};
	}, []);

	// Listen for sidebar collapsed change events from settings UI
	useEffect(() => {
		const handleSidebarCollapsedChange = (event: Event) => {
			const customEvent = event as CustomEvent<{ collapsed: boolean }>;
			const { collapsed } = customEvent.detail;
			setIsCollapsed(collapsed);
			// Update cookie to match
			setCookieValue(
				SIDEBAR_COOKIE_NAME,
				collapsed ? "false" : "true",
				60 * 60 * 24 * 7,
			);
		};

		window.addEventListener(
			"sidebar-collapsed-change",
			handleSidebarCollapsedChange,
		);
		return () => {
			window.removeEventListener(
				"sidebar-collapsed-change",
				handleSidebarCollapsedChange,
			);
		};
	}, []);

	return (
		<PageStatusProvider>
			<ChatProvider>
				<NotificationsProvider>
					<SidebarProvider
						open={!isCollapsed}
						onOpenChange={handleSidebarOpenChange}
					>
						<AppSidebar hideNavigation={hideNavigation} />
						{/* Chat + scroll region share one flex row so main uses width minus Janbot. */}
						<SidebarInset className="flex h-svh min-w-0 flex-1 flex-col overflow-hidden">
							<Navbar toolbar={headerToolbar} />
							<div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
								<main className="@container/main flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
									<div className="flex flex-1 flex-col p-4 pb-8 @md/main:p-6 @md/main:pb-12 @lg/main:p-8 @lg/main:pb-16">
										{children}
									</div>
									<DashboardFooter />
								</main>
								<ChatSidebar />
							</div>
						</SidebarInset>
					</SidebarProvider>
				</NotificationsProvider>
			</ChatProvider>
		</PageStatusProvider>
	);
}

"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
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
} from "@/lib/settings/settingsClient";
import { ChatProvider, ChatSidebar, NavbarChatButton } from "@/components/chat";
import { PageStatusProvider } from "@/components/PageStatusProvider";

interface DashboardLayoutProps {
	children: React.ReactNode;
	/** Initial sidebar collapsed state from server */
	initialSidebarCollapsed?: boolean;
}

const SIDEBAR_COOKIE_NAME = "sidebar_state";

/**
 * Helper to set cookie value
 */
function setCookieValue(name: string, value: string, maxAge: number): void {
	if (typeof document === "undefined") return;
	document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
}

function Navbar() {
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

	return (
		<header className="z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 shadow-xs">
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="mx-2 h-6" />
			<div className="flex-1 min-w-0">
				<NavBreadcrumb />
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<NavbarClock
					timezone={effectiveTimezone}
					defaultFormat={effectiveClockFormat}
					size="sm"
					showTimezoneMismatch={true}
				/>
				<UmaBadge />
				<NavbarChatButton />
			</div>
		</header>
	);
}

export function DashboardLayout({
	children,
	initialSidebarCollapsed = false,
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
				<SidebarProvider
					open={!isCollapsed}
					onOpenChange={handleSidebarOpenChange}
				>
					<AppSidebar />
					<SidebarInset className="flex h-screen flex-col overflow-hidden">
						<Navbar />
						<main className="@container/main flex min-h-0 flex-1 flex-col overflow-y-auto">
							<div className="flex flex-col p-4 pb-8 @md/main:p-6 @md/main:pb-12 @lg/main:p-8 @lg/main:pb-16">
								{children}
							</div>
							<footer className="flex shrink-0 items-center justify-center py-6 opacity-40">
								<Logo variant="logo" />
							</footer>
						</main>
					</SidebarInset>
					<ChatSidebar />
				</SidebarProvider>
			</ChatProvider>
		</PageStatusProvider>
	);
}

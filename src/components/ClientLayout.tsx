"use client";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { PageStatusProvider } from "@/components/PageStatusProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OrgBootstrapper } from "@/components/OrgBootstrapper";
import { ScrollRestoration } from "@/components/ScrollRestoration";
import { Toaster } from "@/components/ui/sonner";
import { RateLimitBlocker } from "@/components/RateLimitBlocker";
import { OpenCVProvider } from "@/lib/document-scanner/OpenCVProvider";
import { TesseractProvider } from "@/lib/document-scanner/TesseractLoader";
import type { OrganizationsData } from "@/lib/auth/organizations-server";
import { useSessionSync } from "@/lib/auth/useSessionSync";
import { useIOSKeyboardFix } from "@/hooks/use-ios-keyboard-fix";

export default function ClientLayout({
	children,
	initialOrganizations,
	initialSidebarCollapsed,
}: {
	children: React.ReactNode;
	initialOrganizations?: OrganizationsData | null;
	initialSidebarCollapsed?: boolean;
}) {
	useSessionSync();
	useIOSKeyboardFix();

	return (
		<ThemeProvider>
			<LanguageProvider>
				<PageStatusProvider>
					<OpenCVProvider>
						<TesseractProvider>
							<ScrollRestoration />
							{/*
							 * OrgBootstrapper acts as the single readiness gate.
							 * It pre-fetches JWT, subscription status, and org settings in parallel
							 * alongside the member fetch, then mounts SubscriptionProvider with the
							 * pre-loaded data so children see it fully initialized on first render.
							 */}
							<OrgBootstrapper
								initialOrganizations={initialOrganizations || undefined}
							>
								<DashboardLayout
									initialSidebarCollapsed={initialSidebarCollapsed}
								>
									{children}
								</DashboardLayout>
							</OrgBootstrapper>
							<Toaster />
							<RateLimitBlocker />
						</TesseractProvider>
					</OpenCVProvider>
				</PageStatusProvider>
			</LanguageProvider>
		</ThemeProvider>
	);
}

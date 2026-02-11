"use client";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { PageStatusProvider } from "@/components/PageStatusProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ViewportHeightProvider } from "@/components/ViewportHeightProvider";
import { OrgBootstrapper } from "@/components/OrgBootstrapper";
import { ScrollRestoration } from "@/components/ScrollRestoration";
import { Toaster } from "@/components/ui/sonner";
import { OpenCVProvider } from "@/lib/document-scanner/OpenCVProvider";
import { TesseractProvider } from "@/lib/document-scanner/TesseractLoader";
import type { OrganizationsData } from "@/lib/auth/organizations-server";
import { useSessionSync } from "@/lib/auth/useSessionSync";

export default function ClientLayout({
	children,
	initialOrganizations,
	initialSidebarCollapsed,
}: {
	children: React.ReactNode;
	initialOrganizations?: OrganizationsData | null;
	initialSidebarCollapsed?: boolean;
}) {
	// Activate cross-tab and cross-app session synchronization
	useSessionSync();

	return (
		<ThemeProvider>
			<LanguageProvider>
				<PageStatusProvider>
					<ViewportHeightProvider>
						<OpenCVProvider>
							<TesseractProvider>
								<ScrollRestoration />
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
							</TesseractProvider>
						</OpenCVProvider>
					</ViewportHeightProvider>
				</PageStatusProvider>
			</LanguageProvider>
		</ThemeProvider>
	);
}

"use client";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { PageStatusProvider } from "@/components/PageStatusProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ViewportHeightProvider } from "@/components/ViewportHeightProvider";
import { OrgBootstrapper } from "@/components/OrgBootstrapper";
import { ScrollRestoration } from "@/components/ScrollRestoration";
import { Toaster } from "@/components/ui/sonner";
import type { OrganizationsData } from "@/lib/auth/organizations-server";

export default function ClientLayout({
	children,
	initialOrganizations,
	initialSidebarCollapsed,
}: {
	children: React.ReactNode;
	initialOrganizations?: OrganizationsData | null;
	initialSidebarCollapsed?: boolean;
}) {
	return (
		<ThemeProvider>
			<LanguageProvider>
				<PageStatusProvider>
					<ViewportHeightProvider>
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
					</ViewportHeightProvider>
				</PageStatusProvider>
			</LanguageProvider>
		</ThemeProvider>
	);
}

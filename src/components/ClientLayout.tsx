"use client";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ViewportHeightProvider } from "@/components/ViewportHeightProvider";
import { OrgBootstrapper } from "@/components/OrgBootstrapper";
import { ScrollRestoration } from "@/components/ScrollRestoration";
import { Toaster } from "@/components/ui/sonner";
import type { OrganizationsData } from "@/lib/auth/organizations-server";

export default function ClientLayout({
	children,
	initialOrganizations,
}: {
	children: React.ReactNode;
	initialOrganizations?: OrganizationsData | null;
}) {
	return (
		<ThemeProvider>
			<ViewportHeightProvider>
				<ScrollRestoration />
				<OrgBootstrapper
					initialOrganizations={initialOrganizations || undefined}
				>
					<DashboardLayout>{children}</DashboardLayout>
				</OrgBootstrapper>
				<Toaster />
			</ViewportHeightProvider>
		</ThemeProvider>
	);
}

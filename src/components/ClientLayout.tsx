"use client";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ViewportHeightProvider } from "@/components/ViewportHeightProvider";
import { OrgBootstrapper } from "@/components/OrgBootstrapper";
import { Toaster } from "@/components/ui/sonner";

export default function ClientLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ThemeProvider>
			<ViewportHeightProvider>
				<OrgBootstrapper>
					<DashboardLayout>{children}</DashboardLayout>
				</OrgBootstrapper>
				<Toaster />
			</ViewportHeightProvider>
		</ThemeProvider>
	);
}

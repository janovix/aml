"use client";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ViewportHeightProvider } from "@/components/ViewportHeightProvider";

export default function ClientLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ThemeProvider>
			<ViewportHeightProvider>
				<DashboardShell>{children}</DashboardShell>
			</ViewportHeightProvider>
		</ThemeProvider>
	);
}

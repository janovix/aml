"use client";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ViewportHeightProvider } from "@/components/ViewportHeightProvider";

export default function ClientLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ThemeProvider>
			<ViewportHeightProvider>
				<DashboardLayout>{children}</DashboardLayout>
			</ViewportHeightProvider>
		</ThemeProvider>
	);
}

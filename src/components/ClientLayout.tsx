"use client";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function ClientLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ThemeProvider>
			<DashboardShell>{children}</DashboardShell>
		</ThemeProvider>
	);
}

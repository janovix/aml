"use client";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function ClientLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ThemeProvider>
			<div className="fixed bottom-4 right-4">
				<ThemeSwitcher />
			</div>
			{children}
		</ThemeProvider>
	);
}

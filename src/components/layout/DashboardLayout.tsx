"use client";

import * as React from "react";
import { ThemeSwitcher } from "@algtools/ui";
import { cn } from "@/lib/utils";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface DashboardLayoutProps {
	children: React.ReactNode;
}

function Navbar() {
	const [isScrollingDown, setIsScrollingDown] = React.useState(false);
	const [lastScrollY, setLastScrollY] = React.useState(0);

	React.useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			if (currentScrollY > lastScrollY && currentScrollY > 10) {
				setIsScrollingDown(true);
			} else {
				setIsScrollingDown(false);
			}
			setLastScrollY(currentScrollY);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [lastScrollY]);

	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-transform duration-300",
				isScrollingDown ? "-translate-y-full" : "translate-y-0",
			)}
		>
			<SidebarTrigger className="-ml-1" />
			<div className="flex flex-1 items-center justify-end gap-2">
				<ThemeSwitcher />
			</div>
		</header>
	);
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
	return (
		<SidebarProvider defaultOpen={true}>
			<AppSidebar />
			<SidebarInset className="flex flex-col">
				<Navbar />
				<main className="flex flex-1 flex-col overflow-auto">
					<div className="flex-1 p-4 md:p-6 lg:p-8">{children}</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

"use client";

import * as React from "react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
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
	return (
		<header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
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
			<SidebarInset className="h-screen overflow-y-auto">
				<Navbar />
				<main className="flex flex-1 flex-col">
					<div className="flex-1 p-4 md:p-6 lg:p-8">{children}</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

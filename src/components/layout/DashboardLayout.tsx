"use client";

import * as React from "react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "./AppSidebar";
import { NavBreadcrumb } from "./NavBreadcrumb";
import { Logo } from "./Logo";
import { UmaBadge } from "./UmaBadge";

interface DashboardLayoutProps {
	children: React.ReactNode;
}

function Navbar() {
	return (
		<header className="z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 shadow-xs">
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="mx-2 h-6" />
			<div className="flex-1 min-w-0">
				<NavBreadcrumb />
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<UmaBadge />
				<LanguageSwitcher />
				<ThemeSwitcher />
			</div>
		</header>
	);
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
	return (
		<SidebarProvider defaultOpen={true}>
			<AppSidebar />
			<SidebarInset className="flex h-screen flex-col overflow-hidden">
				<Navbar />
				<main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
					<div className="flex flex-1 flex-col p-4 pb-8 md:p-6 md:pb-12 lg:p-8 lg:pb-16">
						{children}
					</div>
					<footer className="flex shrink-0 items-center justify-center py-6 opacity-40">
						<Logo variant="logo" />
					</footer>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

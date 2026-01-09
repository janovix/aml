"use client";

import Link from "next/link";
import { LogOut, Settings, User, ChevronsUpDown } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/components/LanguageProvider";

interface NavUserProps {
	user: {
		name: string;
		email: string;
		avatar?: string;
	} | null;
	isLoading?: boolean;
	onLogout: () => void;
}

function getInitials(name: string): string {
	const parts = name.split(" ").filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
	return (
		parts[0].charAt(0).toUpperCase() +
		parts[parts.length - 1].charAt(0).toUpperCase()
	);
}

export function NavUser({ user, isLoading = false, onLogout }: NavUserProps) {
	const { isMobile, setOpenMobile } = useSidebar();
	const { t } = useLanguage();

	const handleLinkClick = () => {
		if (isMobile) {
			setOpenMobile(false);
		}
	};

	if (isLoading) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="lg" className="animate-pulse">
						<div className="h-8 w-8 rounded-lg bg-muted" />
						<div className="grid flex-1 gap-1">
							<div className="h-4 w-20 rounded bg-muted" />
							<div className="h-3 w-32 rounded bg-muted" />
						</div>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage src={user.avatar} alt={user.name} />
								<AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
									{getInitials(user.name)}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{user.name}</span>
								<span className="truncate text-xs text-muted-foreground">
									{user.email}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage src={user.avatar} alt={user.name} />
									<AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
										{getInitials(user.name)}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{user.name}</span>
									<span className="truncate text-xs text-muted-foreground">
										{user.email}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem asChild>
								<Link
									href="/settings"
									className="flex items-center gap-2"
									onClick={handleLinkClick}
								>
									<Settings className="size-4" />
									{t("navSettings")}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link
									href="/settings/profile"
									className="flex items-center gap-2"
									onClick={handleLinkClick}
								>
									<User className="size-4" />
									{t("sidebarProfile")}
								</Link>
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem className="gap-2" onClick={onLogout}>
							<LogOut className="size-4" />
							{t("sidebarLogout")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

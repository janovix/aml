"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { useChats } from "@/components/chat/ChatProvider";

interface FormAction {
	label: string;
	onClick: () => void;
	icon?: LucideIcon;
	variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
	disabled?: boolean;
	loading?: boolean;
	type?: "button" | "submit";
}

interface FormActionBarProps {
	actions: FormAction[];
	className?: string;
}

const LG_BREAKPOINT = 1024;
const MODE_STORAGE_KEY = "janovix-chat-mode";
const WIDTH_STORAGE_KEY = "janovix-chat-sidebar-width";
const DEFAULT_CHAT_WIDTH = 380;

type ChatMode = "sidebar" | "floating";

function loadChatMode(): ChatMode {
	if (typeof window === "undefined") return "sidebar";
	try {
		const stored = sessionStorage.getItem(MODE_STORAGE_KEY);
		if (stored === "floating" || stored === "sidebar") {
			return stored;
		}
	} catch {
		// Ignore errors
	}
	return "sidebar";
}

function loadChatWidth(): number {
	if (typeof window === "undefined") return DEFAULT_CHAT_WIDTH;
	try {
		const stored = sessionStorage.getItem(WIDTH_STORAGE_KEY);
		if (stored) {
			const width = parseInt(stored, 10);
			if (!isNaN(width)) {
				return width;
			}
		}
	} catch {
		// Ignore errors
	}
	return DEFAULT_CHAT_WIDTH;
}

/**
 * FormActionBar - A sticky bottom bar for form actions
 *
 * Features:
 * - Fixed at the bottom of the viewport
 * - Responsive layout (stacked on mobile, horizontal on desktop)
 * - Consistent styling with backdrop blur and border
 * - Safe area padding for mobile devices
 * - Z-index management to stay above content
 * - Automatically adjusts position to accommodate chat sidebar
 *
 * Usage:
 * - Add `pb-24 md:pb-20` to the parent container to prevent content from being hidden
 * - Primary action should be first in the actions array (appears on right on desktop)
 */
export function FormActionBar({
	actions,
	className,
}: FormActionBarProps): React.JSX.Element {
	const { state, isMobile } = useSidebar();
	const { isOpen: isChatOpen } = useChats();
	const [chatMode, setChatMode] = useState<ChatMode>("sidebar");
	const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
	const [isLargeScreen, setIsLargeScreen] = useState(false);

	// Track screen size
	useEffect(() => {
		function checkScreenSize() {
			setIsLargeScreen(window.innerWidth >= LG_BREAKPOINT);
		}
		checkScreenSize();
		window.addEventListener("resize", checkScreenSize);
		return () => window.removeEventListener("resize", checkScreenSize);
	}, []);

	// Track chat mode and width changes
	useEffect(() => {
		function updateChatSettings() {
			setChatMode(loadChatMode());
			setChatWidth(loadChatWidth());
		}

		updateChatSettings();

		// Listen for chat mode changes
		window.addEventListener("chat-mode-change", updateChatSettings);
		window.addEventListener("storage", updateChatSettings);

		// Listen for chat width changes (custom event from ChatSidebar resize)
		const handleWidthChange = (e: Event) => {
			const customEvent = e as CustomEvent;
			if (customEvent.detail?.width) {
				setChatWidth(customEvent.detail.width);
			}
		};
		window.addEventListener("chat-width-change", handleWidthChange);

		return () => {
			window.removeEventListener("chat-mode-change", updateChatSettings);
			window.removeEventListener("storage", updateChatSettings);
			window.removeEventListener("chat-width-change", handleWidthChange);
		};
	}, []);

	// Calculate right offset based on chat sidebar state
	// For sidebar mode: offset by sidebar width when open on large screens
	// For floating mode: no offset needed (button is now in navbar, not bottom-right)
	const shouldOffsetForChatSidebar =
		isLargeScreen && isChatOpen && chatMode === "sidebar";

	const chatOffset = shouldOffsetForChatSidebar ? chatWidth : 0;

	return (
		<div
			className={cn(
				// Fixed positioning - respect sidebar on desktop
				"fixed bottom-4 z-40",
				// Left positioning based on sidebar state (desktop only)
				"left-4 md:left-[calc(var(--sidebar-width)+1rem)]",
				// Transition for smooth sidebar animation - matches chat sidebar duration
				"transition-[left,right] duration-200 ease-in-out",
				// When sidebar is collapsed on desktop, adjust left position
				state === "collapsed" &&
					!isMobile &&
					"md:left-[calc(var(--sidebar-width-icon)+1rem)]",
				className,
			)}
			style={
				{
					"--sidebar-width": "var(--sidebar-width, 16rem)",
					"--sidebar-width-icon": "var(--sidebar-width-icon, 3rem)",
					right: `calc(1rem + ${chatOffset}px)`,
				} as React.CSSProperties
			}
		>
			<div
				className={cn(
					// Floating glossy card styling
					"rounded-xl border border-border/40",
					"bg-background/80 backdrop-blur-xl",
					"supports-[backdrop-filter]:bg-background/60",
					// Shadow for depth
					"shadow-2xl shadow-black/10 dark:shadow-black/40",
					// Subtle ring for extra polish
					"ring-1 ring-black/5 dark:ring-white/5",
					// Padding
					"px-3 py-2",
					// Safe area padding for mobile devices
					"pb-safe",
				)}
			>
				{/* Mobile: Stack buttons vertically */}
				<div className="flex flex-col-reverse gap-2 md:hidden">
					{actions.map((action, index) => {
						const Icon = action.icon;
						return (
							<Button
								key={index}
								onClick={action.onClick}
								variant={
									action.variant || (index === 0 ? "default" : "outline")
								}
								disabled={action.disabled}
								type={action.type || "button"}
								className="w-full rounded-xl"
							>
								{action.loading ? (
									<>
										<span className="animate-spin mr-2">⏳</span>
										{action.label}
									</>
								) : (
									<>
										{Icon && <Icon className="h-4 w-4 mr-2" />}
										{action.label}
									</>
								)}
							</Button>
						);
					})}
				</div>

				{/* Desktop: Horizontal layout with primary action on right */}
				<div className="hidden md:flex md:items-center md:justify-end md:gap-2">
					{/* Reverse the array so primary action (first) appears on the right */}
					{[...actions].reverse().map((action, index) => {
						const Icon = action.icon;
						const originalIndex = actions.length - 1 - index;
						return (
							<Button
								key={originalIndex}
								onClick={action.onClick}
								variant={
									action.variant ||
									(originalIndex === 0 ? "default" : "outline")
								}
								disabled={action.disabled}
								type={action.type || "button"}
							>
								{action.loading ? (
									<>
										<span className="animate-spin mr-2">⏳</span>
										{action.label}
									</>
								) : (
									<>
										{Icon && <Icon className="h-4 w-4 mr-2" />}
										{action.label}
									</>
								)}
							</Button>
						);
					})}
				</div>
			</div>
		</div>
	);
}

"use client";

/**
 * ChatSidebar
 *
 * Right sidebar for AI chat with multiple modes:
 * - Large screens (lg+): Toggle between sidebar or floating panel
 * - Small/Medium screens: Fullscreen overlay
 *
 * Features animated bot icon that reflects chat state.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2, X, GripVertical, PanelRight } from "lucide-react";
import { useChats } from "./ChatProvider";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
// TODO: Enable when auth-svc billing is implemented
// import { ChatUsageDisplay } from "./ChatUsageDisplay";
import { AnimatedBotIcon } from "./AnimatedBotIcon";
import { useLanguage } from "@/components/LanguageProvider";

const WIDTH_STORAGE_KEY = "janovix-chat-sidebar-width";
const MODE_STORAGE_KEY = "janovix-chat-mode";
const DEFAULT_WIDTH = 380;
const MIN_WIDTH = 300;
const MAX_WIDTH = 600;
const LG_BREAKPOINT = 1024;

type ChatMode = "sidebar" | "floating";

interface ChatSidebarProps {
	className?: string;
}

function loadWidth(): number {
	if (typeof window === "undefined") return DEFAULT_WIDTH;
	try {
		const stored = sessionStorage.getItem(WIDTH_STORAGE_KEY);
		if (stored) {
			const width = parseInt(stored, 10);
			if (!isNaN(width) && width >= MIN_WIDTH && width <= MAX_WIDTH) {
				return width;
			}
		}
	} catch {
		// Ignore errors
	}
	return DEFAULT_WIDTH;
}

function saveWidth(width: number): void {
	if (typeof window === "undefined") return;
	try {
		sessionStorage.setItem(WIDTH_STORAGE_KEY, String(width));
	} catch {
		// Ignore errors
	}
}

function loadMode(): ChatMode {
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

function saveMode(mode: ChatMode): void {
	if (typeof window === "undefined") return;
	try {
		sessionStorage.setItem(MODE_STORAGE_KEY, mode);
		// Dispatch custom event so NavbarChatButton can react
		window.dispatchEvent(new CustomEvent("chat-mode-change", { detail: mode }));
	} catch {
		// Ignore errors
	}
}

/**
 * Chat button for the navbar
 * Visibility rules:
 * - Large screens + sidebar mode + chat open: HIDDEN (icon is in sidebar header)
 * - Large screens + sidebar mode + chat closed: SHOWN
 * - Large screens + floating mode: SHOWN (now in navbar instead of bottom-right)
 * - Small screens: ALWAYS SHOWN
 */
export function NavbarChatButton({ className }: { className?: string }) {
	const { toggleChat, isOpen, botExpression, isSleeping, wakeUp } = useChats();
	const { t } = useLanguage();
	const [isLargeScreen, setIsLargeScreen] = useState(false);
	const [currentMode, setCurrentMode] = useState<ChatMode>("sidebar");

	useEffect(() => {
		function update() {
			setIsLargeScreen(window.innerWidth >= LG_BREAKPOINT);
			setCurrentMode(loadMode());
		}
		update();
		window.addEventListener("resize", update);
		window.addEventListener("chat-mode-change", update);
		return () => {
			window.removeEventListener("resize", update);
			window.removeEventListener("chat-mode-change", update);
		};
	}, []);

	// Hide when: large screen + sidebar mode + chat is open (icon is in sidebar header)
	const hideBecauseSidebarOpen =
		isLargeScreen && currentMode === "sidebar" && isOpen;

	// Don't render if conditions say to hide
	if (hideBecauseSidebarOpen) {
		return null;
	}

	const handleClick = () => {
		// Wake up the bot if sleeping, otherwise toggle chat
		if (isSleeping) {
			wakeUp();
		} else {
			toggleChat();
		}
	};

	return (
		<button
			onClick={handleClick}
			className={cn(
				"relative flex items-center justify-center cursor-pointer",
				"hover:scale-110 active:scale-95 transition-transform duration-150",
				"focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg",
				isOpen && "scale-105",
				className,
			)}
			title={isSleeping ? t("chatWakeUp") : t("chatTitle")}
			aria-label={isSleeping ? t("chatWakeUp") : t("chatTitle")}
			aria-expanded={isOpen}
			id="navbar-chat-button"
		>
			<AnimatedBotIcon expression={botExpression} size={44} />
		</button>
	);
}

/**
 * Shared chat content
 */
function ChatContent({
	onClose,
	mode,
	onModeChange,
	showModeToggle = false,
	showHeaderIcon = false,
}: {
	onClose: () => void;
	mode: ChatMode;
	onModeChange: (mode: ChatMode) => void;
	showModeToggle?: boolean;
	showHeaderIcon?: boolean;
}) {
	const { messages, clearMessages, botExpression } = useChats();
	const { t } = useLanguage();

	return (
		<>
			{/* Header - matches navbar h-16 */}
			<div className="flex h-16 items-center justify-between px-4 border-b shrink-0 bg-muted/30">
				<div className="flex items-center gap-3">
					{showHeaderIcon && (
						<AnimatedBotIcon expression={botExpression} size={52} />
					)}
					<h2 className="text-sm font-semibold">{t("chatTitle")}</h2>
				</div>
				<div className="flex items-center gap-1">
					{/* Mode toggle - only on large screens */}
					{showModeToggle && (
						<Button
							variant="ghost"
							size="icon"
							onClick={() =>
								onModeChange(mode === "sidebar" ? "floating" : "sidebar")
							}
							className="h-8 w-8"
							title={
								mode === "sidebar"
									? t("chatSwitchToFloating")
									: t("chatSwitchToSidebar")
							}
						>
							<PanelRight
								className={cn(
									"h-4 w-4 transition-transform",
									mode === "floating" && "rotate-180",
								)}
							/>
							<span className="sr-only">{t("chatToggleMode")}</span>
						</Button>
					)}
					{messages.length > 0 && (
						<Button
							variant="ghost"
							size="icon"
							onClick={clearMessages}
							className="h-8 w-8"
							title={t("chatClear")}
						>
							<Trash2 className="h-4 w-4" />
							<span className="sr-only">{t("chatClear")}</span>
						</Button>
					)}
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="h-8 w-8"
						title={t("chatClose")}
					>
						<X className="h-4 w-4" />
						<span className="sr-only">{t("chatClose")}</span>
					</Button>
				</div>
			</div>

			{/* TODO: Usage display - enable when auth-svc billing is implemented */}
			{/* <div className="px-4 pb-1 shrink-0 border-b">
				<ChatUsageDisplay />
			</div> */}

			{/* Messages area */}
			<ChatMessages className="flex-1 min-h-0 overflow-hidden" />

			{/* Input area */}
			<ChatInput className="shrink-0 border-t" />
		</>
	);
}

/**
 * Resize handle component
 */
function ResizeHandle({
	onMouseDown,
	isResizing,
}: {
	onMouseDown: (e: React.MouseEvent) => void;
	isResizing: boolean;
}) {
	return (
		<div
			onMouseDown={onMouseDown}
			className={cn(
				"absolute left-0 top-0 bottom-0 w-4 -ml-2 cursor-col-resize z-20",
				"flex items-center justify-center",
				"group",
			)}
			title="Drag to resize"
		>
			{/* Visual indicator */}
			<div
				className={cn(
					"w-1 h-16 rounded-full transition-colors",
					"bg-border group-hover:bg-primary/50",
					isResizing && "bg-primary",
				)}
			/>
			{/* Grip icon on hover */}
			<div
				className={cn(
					"absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
					"opacity-0 group-hover:opacity-100 transition-opacity",
					"text-muted-foreground",
					isResizing && "opacity-100",
				)}
			>
				<GripVertical className="h-4 w-4" />
			</div>
		</div>
	);
}

export function ChatSidebar({ className }: ChatSidebarProps) {
	const { isOpen, closeChat, toggleChat, botExpression, isSleeping, wakeUp } =
		useChats();
	const { t } = useLanguage();
	const [width, setWidth] = useState(DEFAULT_WIDTH);
	const [isResizing, setIsResizing] = useState(false);
	const [isSmallScreen, setIsSmallScreen] = useState(false);
	const [mode, setMode] = useState<ChatMode>("sidebar");
	const [mounted, setMounted] = useState(false);
	const sidebarRef = useRef<HTMLDivElement>(null);
	const startXRef = useRef(0);
	const startWidthRef = useRef(0);

	// Check screen size
	useEffect(() => {
		setMounted(true);
		function checkScreenSize() {
			setIsSmallScreen(window.innerWidth < LG_BREAKPOINT);
		}
		checkScreenSize();
		window.addEventListener("resize", checkScreenSize);
		return () => window.removeEventListener("resize", checkScreenSize);
	}, []);

	// Load saved preferences on mount
	useEffect(() => {
		setWidth(loadWidth());
		setMode(loadMode());
	}, []);

	const handleModeChange = useCallback((newMode: ChatMode) => {
		setMode(newMode);
		saveMode(newMode);
	}, []);

	// Handle resize start
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsResizing(true);
			startXRef.current = e.clientX;
			startWidthRef.current = width;
		},
		[width],
	);

	// Handle resize
	useEffect(() => {
		if (!isResizing) return;

		const handleMouseMove = (e: MouseEvent) => {
			e.preventDefault();
			const delta = startXRef.current - e.clientX;
			const newWidth = startWidthRef.current + delta;
			const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
			setWidth(clampedWidth);
			// Dispatch event so other components can react to width changes
			window.dispatchEvent(
				new CustomEvent("chat-width-change", {
					detail: { width: clampedWidth },
				}),
			);
		};

		const handleMouseUp = () => {
			setIsResizing(false);
			saveWidth(width);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isResizing, width]);

	// Add resize cursor to body while resizing
	useEffect(() => {
		if (isResizing) {
			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";
			document.body.classList.add("select-none");
		} else {
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
			document.body.classList.remove("select-none");
		}
		return () => {
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
			document.body.classList.remove("select-none");
		};
	}, [isResizing]);

	// Handle floating button click - wake up if sleeping, otherwise toggle
	// NOTE: This must be defined before any conditional returns (Rules of Hooks)
	const handleFloatingClick = useCallback(() => {
		if (isSleeping) {
			wakeUp();
		} else {
			toggleChat();
		}
	}, [isSleeping, wakeUp, toggleChat]);

	// Don't render until mounted (avoid hydration mismatch)
	if (!mounted) {
		return null;
	}

	// Small/Medium screens: fullscreen overlay
	if (isSmallScreen) {
		if (!isOpen) return null;

		return (
			<div
				className={cn(
					"fixed inset-0 z-50 flex flex-col bg-background",
					"animate-in slide-in-from-right duration-300",
				)}
				role="dialog"
				aria-modal="true"
				aria-label="AI Chat Assistant"
			>
				<ChatContent
					onClose={closeChat}
					mode={mode}
					onModeChange={handleModeChange}
					showModeToggle={false}
					showHeaderIcon={true}
				/>
			</div>
		);
	}

	// Large screens - Floating mode
	if (mode === "floating") {
		return (
			<>
				{/* Floating panel - positioned below navbar button */}
				{isOpen && (
					<div
						className={cn(
							"fixed z-50 top-18 right-4 flex flex-col",
							"bg-background border rounded-xl shadow-2xl overflow-hidden",
							"animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200",
						)}
						style={{
							width: Math.min(400, window.innerWidth - 32),
							height: Math.min(560, window.innerHeight - 88),
						}}
						role="dialog"
						aria-label="AI Chat Assistant"
					>
						<ChatContent
							onClose={closeChat}
							mode={mode}
							onModeChange={handleModeChange}
							showModeToggle
						/>
					</div>
				)}
			</>
		);
	}

	// Large screens - Sidebar mode
	if (!isOpen) {
		return null;
	}

	return (
		<aside
			ref={sidebarRef}
			className={cn(
				"relative hidden lg:flex h-screen flex-col border-l bg-background shrink-0",
				isResizing && "select-none",
				className,
			)}
			style={{ width }}
		>
			{/* Resize handle */}
			<ResizeHandle onMouseDown={handleMouseDown} isResizing={isResizing} />

			<ChatContent
				onClose={closeChat}
				mode={mode}
				onModeChange={handleModeChange}
				showModeToggle
				showHeaderIcon
			/>
		</aside>
	);
}

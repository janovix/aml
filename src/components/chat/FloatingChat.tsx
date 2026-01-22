"use client";

/**
 * FloatingChat
 *
 * Provides AI chat in multiple modes:
 * - Mobile: Fullscreen overlay toggled via NavbarChatButton
 * - Desktop: Either floating panel (bottom-right button) or sidebar mode
 *
 * Mode preference is persisted in sessionStorage.
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot, Trash2, Minimize2, PanelRight, X } from "lucide-react";
import { useChats } from "./ChatProvider";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
// TODO: Enable when auth-svc billing is implemented
// import { ChatUsageDisplay } from "./ChatUsageDisplay";
import { useLanguage } from "@/components/LanguageProvider";

const MODE_STORAGE_KEY = "janovix-chat-mode";
const CHAT_WIDTH = 400;
const CHAT_HEIGHT = 520;
const MD_BREAKPOINT = 768;

type ChatMode = "floating" | "sidebar";

interface FloatingChatProps {
	className?: string;
}

function loadMode(): ChatMode {
	if (typeof window === "undefined") return "floating";
	try {
		const stored = sessionStorage.getItem(MODE_STORAGE_KEY);
		if (stored === "floating" || stored === "sidebar") {
			return stored;
		}
	} catch {
		// Ignore errors
	}
	return "floating";
}

function saveMode(mode: ChatMode): void {
	if (typeof window === "undefined") return;
	try {
		sessionStorage.setItem(MODE_STORAGE_KEY, mode);
	} catch {
		// Ignore errors
	}
}

// NavbarChatButton has been moved to ChatSidebar.tsx

/**
 * Chat panel content (shared between floating and sidebar modes)
 */
function ChatPanelContent({
	mode,
	onModeChange,
	isMobile,
}: {
	mode: ChatMode;
	onModeChange: (mode: ChatMode) => void;
	isMobile: boolean;
}) {
	const { closeChat, messages, clearMessages } = useChats();
	const { t } = useLanguage();

	return (
		<>
			{/* Header */}
			<div className="px-4 py-3 border-b shrink-0 bg-muted/30">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
							<Bot className="h-4 w-4 text-primary" />
						</div>
						<div>
							<h2 className="text-base font-semibold">{t("chatTitle")}</h2>
							<p className="text-xs text-muted-foreground">
								{t("chatSubtitle")}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-1">
						{/* Mode toggle - desktop only */}
						{!isMobile && (
							<Button
								variant="ghost"
								size="icon"
								onClick={() =>
									onModeChange(mode === "floating" ? "sidebar" : "floating")
								}
								className="h-8 w-8"
								title={
									mode === "floating"
										? t("chatSwitchToSidebar")
										: t("chatSwitchToFloating")
								}
							>
								<PanelRight
									className={cn(
										"h-4 w-4 transition-transform",
										mode === "sidebar" && "rotate-180",
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
							onClick={closeChat}
							className="h-8 w-8"
							title={isMobile ? t("chatClose") : t("chatClose")}
						>
							{isMobile ? (
								<X className="h-4 w-4" />
							) : (
								<Minimize2 className="h-4 w-4" />
							)}
							<span className="sr-only">{t("chatClose")}</span>
						</Button>
					</div>
				</div>
			</div>

			{/* TODO: Usage display - enable when auth-svc billing is implemented */}
			{/* <div className="px-4 py-1 border-b shrink-0">
				<ChatUsageDisplay />
			</div> */}

			{/* Messages area */}
			<ChatMessages className="flex-1 min-h-0 overflow-hidden" />

			{/* Input area with integrated model selector */}
			<ChatInput className="shrink-0 border-t" />
		</>
	);
}

export function FloatingChat({ className }: FloatingChatProps) {
	const { isOpen, toggleChat } = useChats();
	const { t } = useLanguage();
	const [mode, setMode] = useState<ChatMode>("floating");
	const [isMobile, setIsMobile] = useState(false);
	const [mounted, setMounted] = useState(false);
	// Store window dimensions in state to avoid SSR/hydration issues
	const [windowSize, setWindowSize] = useState({ width: 1024, height: 768 });

	// Check if mobile on mount and resize, also track window size
	useEffect(() => {
		setMounted(true);
		function handleResize() {
			setIsMobile(window.innerWidth < MD_BREAKPOINT);
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		}
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Load mode preference on mount
	useEffect(() => {
		setMode(loadMode());
	}, []);

	const handleModeChange = useCallback((newMode: ChatMode) => {
		setMode(newMode);
		saveMode(newMode);
	}, []);

	// Don't render until mounted (avoid hydration mismatch)
	if (!mounted) {
		return null;
	}

	// Mobile: fullscreen overlay
	if (isMobile) {
		return (
			<>
				{isOpen && (
					<div
						className={cn(
							"fixed inset-0 z-50 flex flex-col",
							"bg-background",
							"animate-in slide-in-from-bottom duration-300",
						)}
						role="dialog"
						aria-modal="true"
						aria-label="AI Chat Assistant"
					>
						<ChatPanelContent
							mode={mode}
							onModeChange={handleModeChange}
							isMobile={true}
						/>
					</div>
				)}
			</>
		);
	}

	// Desktop: floating button + panel OR sidebar
	// Use state-derived window dimensions to avoid SSR issues
	const chatWidth = Math.min(CHAT_WIDTH, windowSize.width - 32);
	const chatHeight = Math.min(CHAT_HEIGHT, windowSize.height - 32);

	return (
		<>
			{/* Floating Button - only in floating mode */}
			{mode === "floating" && (
				<button
					onClick={toggleChat}
					className={cn(
						"fixed z-50 bottom-6 right-6 flex items-center justify-center",
						"h-14 w-14 rounded-full",
						"bg-primary text-primary-foreground shadow-lg",
						"hover:bg-primary/90 hover:shadow-xl hover:scale-105",
						"active:scale-95",
						"transition-all duration-200 ease-out",
						"focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
						isOpen && "ring-2 ring-primary/50 ring-offset-2",
						className,
					)}
					title={isOpen ? t("chatClose") : t("chatTitle")}
					aria-label={isOpen ? t("chatClose") : t("chatTitle")}
					aria-expanded={isOpen}
				>
					<Bot className="h-6 w-6" />
				</button>
			)}

			{/* Sidebar toggle button - only in sidebar mode when closed */}
			{mode === "sidebar" && !isOpen && (
				<button
					onClick={toggleChat}
					className={cn(
						"fixed z-50 top-1/2 -translate-y-1/2 right-0",
						"flex items-center justify-center",
						"h-12 w-8 rounded-l-lg",
						"bg-primary text-primary-foreground shadow-lg",
						"hover:bg-primary/90 hover:w-10",
						"transition-all duration-200 ease-out",
						"focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					)}
					title={t("chatTitle")}
					aria-label={t("chatTitle")}
					aria-expanded={false}
				>
					<Bot className="h-5 w-5" />
				</button>
			)}

			{/* Chat Panel */}
			{isOpen && (
				<div
					className={cn(
						"fixed z-50 flex flex-col overflow-hidden",
						"bg-background border shadow-2xl",
						"animate-in duration-200",
						mode === "floating" && [
							"bottom-24 right-6 rounded-xl",
							"fade-in-0 zoom-in-95",
						],
						mode === "sidebar" && [
							"top-0 right-0 bottom-0 rounded-none border-r-0 border-t-0 border-b-0",
							"slide-in-from-right",
						],
					)}
					style={
						mode === "floating"
							? {
									width: chatWidth,
									height: chatHeight,
								}
							: {
									width: Math.min(420, windowSize.width * 0.35),
								}
					}
					role="complementary"
					aria-label="AI Chat Assistant"
				>
					<ChatPanelContent
						mode={mode}
						onModeChange={handleModeChange}
						isMobile={false}
					/>
				</div>
			)}
		</>
	);
}

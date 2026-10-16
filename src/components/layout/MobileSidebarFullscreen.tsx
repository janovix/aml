"use client";

import * as React from "react";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";
import { ShaderBackdrop } from "@/components/shader/shader-backdrop";
import { AppSwitcher } from "./AppSwitcher";

interface MobileSidebarFullscreenProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Content for the fixed top section (e.g., OrgSwitcher) */
	topContent?: React.ReactNode;
	/** Main scrollable navigation content */
	children: React.ReactNode;
	/** Content for the fixed bottom section (e.g., Language/Theme/User) */
	bottomContent?: React.ReactNode;
}

export function MobileSidebarFullscreen({
	open,
	onOpenChange,
	topContent,
	children,
	bottomContent,
}: MobileSidebarFullscreenProps) {
	const { t } = useLanguage();

	// Gesture thresholds
	const SWIPE_THRESHOLD = 100; // px
	const VELOCITY_THRESHOLD = 500; // px/s

	const handleDragEnd = React.useCallback(
		(_: unknown, info: PanInfo) => {
			const { offset, velocity } = info;

			// Close if dragged right far enough or with enough velocity
			if (offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) {
				onOpenChange(false);
			}
		},
		[onOpenChange],
	);

	// Prevent body scroll when open and add class for dropdown styling
	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
			document.body.classList.add("mobile-sidebar-open");
		} else {
			document.body.style.overflow = "";
			document.body.classList.remove("mobile-sidebar-open");
		}
		return () => {
			document.body.style.overflow = "";
			document.body.classList.remove("mobile-sidebar-open");
		};
	}, [open]);

	return (
		<AnimatePresence mode="wait">
			{open && (
				<>
					{/* Backdrop - z-[100] to be above app navbar */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
						onClick={() => onOpenChange(false)}
						aria-hidden="true"
					/>

					{/* Fullscreen sidebar - z-[100] to be above app navbar */}
					<motion.div
						initial={{ x: "-100%", opacity: 0.8 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: "-100%", opacity: 0.8 }}
						transition={{
							type: "spring",
							damping: 30,
							stiffness: 300,
						}}
						drag="x"
						dragDirectionLock
						dragConstraints={{ left: 0, right: 0 }}
						dragElastic={{ left: 0, right: 0.5 }}
						onDragEnd={handleDragEnd}
						className={cn(
							"fixed inset-0 z-[100] flex flex-col",
							"touch-pan-y", // Allow vertical scrolling
						)}
						role="dialog"
						aria-modal="true"
						aria-label={t("mobileSidebarNavigation")}
					>
						<ShaderBackdrop position="absolute" />

						{/* Content container */}
						<div className="relative flex h-full flex-col">
							{/* Fixed header - App switcher + close button */}
							<header className="shrink-0 border-b border-white/20 bg-background/90 backdrop-blur-xl">
								<div className="flex h-18 items-center justify-between px-5">
									<AppSwitcher variant="mobile-fullscreen" />

									<button
										onClick={() => onOpenChange(false)}
										className={cn(
											"flex size-12 items-center justify-center rounded-2xl",
											"bg-white/10 text-foreground/80 transition-all duration-200",
											"border border-white/15",
											"hover:bg-white/20 hover:text-foreground hover:scale-105",
											"active:scale-95 active:bg-white/25",
											"focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
											"shadow-lg shadow-black/10",
										)}
										aria-label={t("mobileSidebarClose")}
									>
										<X className="size-6" />
									</button>
								</div>
							</header>

							{/* Fixed top: Org Switcher */}
							{topContent && (
								<div
									className={cn(
										"shrink-0 px-4 py-2",
										// Style the org switcher menu button
										"[&_[data-sidebar=menu-button]]:min-h-14 [&_[data-sidebar=menu-button]]:text-base",
										"[&_[data-sidebar=menu-button]]:rounded-xl [&_[data-sidebar=menu-button]]:px-3",
										"[&_[data-sidebar=menu-button]_svg]:size-5",
										// Remove extra padding from the org switcher wrapper
										"[&>div]:p-0 [&>div]:border-0",
										// Activity chip: remove border, align with org picker, larger text
										"[&_[data-slot=activity-chip]]:border-0 [&_[data-slot=activity-chip]]:px-2 [&_[data-slot=activity-chip]]:pt-1",
										"[&_[data-slot=activity-chip]>div]:px-3",
										"[&_[data-slot=activity-name]]:text-sm",
										// Ensure dropdowns appear above sidebar
										"[&_[data-radix-popper-content-wrapper]]:z-[200]",
									)}
									data-mobile-section="top"
								>
									{topContent}
								</div>
							)}

							{/* Scrollable middle: Navigation groups */}
							<div
								className={cn(
									"flex-1 overflow-y-auto overscroll-contain px-4 py-2 mobile-sidebar-fullscreen",
									// Mobile-optimized styles for touch targets
									"[&_[data-sidebar=menu-button]]:min-h-12 [&_[data-sidebar=menu-button]]:text-base [&_[data-sidebar=menu-button]]:py-2",
									"[&_[data-sidebar=menu-button]]:rounded-xl [&_[data-sidebar=menu-button]]:px-3",
									"[&_[data-sidebar=menu-button][data-active=true]]:bg-white/15 [&_[data-sidebar=menu-button][data-active=true]]:border [&_[data-sidebar=menu-button][data-active=true]]:border-white/20",
									"[&_[data-sidebar=menu-button]_svg]:size-5",
									// Group styling with dividers
									"[&_[data-sidebar=group]]:py-2 [&_[data-sidebar=group]]:px-0",
									"[&_[data-sidebar=group]]:border-b [&_[data-sidebar=group]]:border-white/10",
									"[&_[data-sidebar=group]:last-child]:border-b-0",
									// Label alignment - match menu button padding (px-3 + icon width + gap)
									"[&_[data-sidebar=group-label]]:text-sm [&_[data-sidebar=group-label]]:px-3 [&_[data-sidebar=group-label]]:opacity-70 [&_[data-sidebar=group-label]]:mb-1",
									"[&_[data-sidebar=separator]]:my-2 [&_[data-sidebar=separator]]:bg-white/10",
									"[&_[data-sidebar=content]]:gap-1",
									// Ensure dropdowns appear above sidebar
									"[&_[data-radix-popper-content-wrapper]]:z-[200]",
								)}
							>
								{children}
							</div>

							{/* Fixed bottom: Language, Theme, User */}
							{bottomContent && (
								<div
									className={cn(
										"shrink-0 border-t border-white/10 bg-background/50 backdrop-blur-xl px-4 py-3",
										// Style footer elements
										"[&_[data-sidebar=menu-button]]:min-h-14 [&_[data-sidebar=menu-button]]:text-base",
										"[&_[data-sidebar=menu-button]]:rounded-xl [&_[data-sidebar=menu-button]]:px-3 [&_[data-sidebar=menu-button]]:my-1",
										"[&_[data-sidebar=menu-button]_svg]:size-5",
										// Ensure dropdowns appear above sidebar
										"[&_[data-radix-popper-content-wrapper]]:z-[200]",
									)}
									data-mobile-section="bottom"
								>
									{bottomContent}
								</div>
							)}
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

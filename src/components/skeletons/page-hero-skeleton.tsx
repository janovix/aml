"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { SKELETON_HEIGHTS } from "@/lib/constants/skeleton-heights";

export interface PageHeroSkeletonProps {
	/** Whether to show stats cards skeleton (default: true) */
	showStats?: boolean;
	/** Whether to show back button skeleton (default: false) */
	showBackButton?: boolean;
	/** Whether to show action buttons skeleton (default: true) */
	showActions?: boolean;
	/** Number of action buttons to show (default: 1) */
	actionCount?: number;
	/** Additional class names */
	className?: string;
}

/**
 * Skeleton component for PageHero that matches the actual PageHero dimensions
 * to prevent layout jumping during loading states.
 */
export function PageHeroSkeleton({
	showStats = true,
	showBackButton = false,
	showActions = true,
	actionCount = 1,
	className,
}: PageHeroSkeletonProps) {
	return (
		<div
			className={cn(
				"space-y-6",
				showStats
					? SKELETON_HEIGHTS.PAGE_HERO_WITH_STATS
					: SKELETON_HEIGHTS.PAGE_HERO_NO_STATS,
				className,
			)}
		>
			{/* Title row with actions */}
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-start gap-3 min-w-0">
					{/* Back button skeleton */}
					{showBackButton && (
						<Skeleton className="h-10 w-10 rounded-md shrink-0 -ml-2" />
					)}
					{/* Icon skeleton */}
					<Skeleton className="h-10 w-10 rounded-lg shrink-0" />
					{/* Title and subtitle skeleton */}
					<div className="min-w-0 space-y-2">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-4 w-72" />
					</div>
				</div>

				{/* Actions skeleton */}
				{showActions && (
					<div className="flex items-center gap-2 shrink-0">
						{Array.from({ length: actionCount }).map((_, index) => (
							<Skeleton
								key={index}
								className={cn(
									"h-9 rounded-md",
									index === actionCount - 1 ? "w-32" : "w-24",
								)}
							/>
						))}
					</div>
				)}
			</div>

			{/* Stats cards skeleton */}
			{showStats && (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-card/50 p-4"
						>
							<div className="flex flex-col gap-2 min-w-0">
								<Skeleton className="h-3 w-20" />
								<Skeleton className="h-7 w-16" />
							</div>
							<Skeleton className="h-10 w-10 rounded-lg shrink-0" />
						</div>
					))}
				</div>
			)}
		</div>
	);
}

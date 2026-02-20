"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ViewSkeletonProps {
	/** Hero/header area skeleton (PageHeroSkeleton or custom equivalent) */
	hero: ReactNode;
	/** Main content area skeleton */
	children: ReactNode;
	/** Additional classes for the outer wrapper */
	className?: string;
}

/**
 * Layout wrapper for view-level loading skeletons.
 *
 * All view skeletons should use this component to guarantee:
 *  - Consistent vertical spacing between hero and content
 *  - The same structural footprint as the real rendered view
 *  - No full-page spinners that cause CLS
 *
 * Usage:
 * ```tsx
 * export function MyViewSkeleton() {
 *   return (
 *     <ViewSkeleton
 *       hero={<PageHeroSkeleton showStats showBackButton />}
 *     >
 *       <Card>...</Card>
 *     </ViewSkeleton>
 *   );
 * }
 * ```
 */
export function ViewSkeleton({ hero, children, className }: ViewSkeletonProps) {
	return (
		<div className={cn("space-y-6", className)}>
			{hero}
			{children}
		</div>
	);
}

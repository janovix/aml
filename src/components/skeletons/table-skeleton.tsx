"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { SKELETON_HEIGHTS } from "@/lib/constants/skeleton-heights";

export interface TableSkeletonProps {
	/** Number of skeleton rows to display (default: 10) */
	rows?: number;
	/** Number of columns to display (default: 5) */
	columns?: number;
	/** Whether to show the search/filter header (default: true) */
	showHeader?: boolean;
	/** Additional class names */
	className?: string;
}

/**
 * Skeleton component for DataTable that matches the actual table dimensions
 * to prevent layout jumping during loading states.
 */
export function TableSkeleton({
	rows = SKELETON_HEIGHTS.TABLE_DEFAULT_ROWS,
	columns = 5,
	showHeader = true,
	className,
}: TableSkeletonProps) {
	return (
		<div
			className={cn(
				"rounded-lg border border-border bg-card overflow-hidden",
				SKELETON_HEIGHTS.TABLE_MIN,
				className,
			)}
		>
			{/* Header with Search and Filters */}
			{showHeader && (
				<div className="border-b border-border bg-muted/20">
					<div className="flex items-center gap-2 p-3">
						{/* Search skeleton */}
						<Skeleton className="h-9 w-64 rounded-md flex-shrink-0" />
						{/* Filter buttons skeleton */}
						<div className="hidden md:flex items-center gap-1.5">
							<Skeleton className="h-9 w-24 rounded-md" />
							<Skeleton className="h-9 w-24 rounded-md" />
						</div>
						{/* Mobile filter button */}
						<Skeleton className="h-9 w-9 rounded-md md:hidden" />
					</div>
				</div>
			)}

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="w-full">
					{/* Table header */}
					<thead className="border-b border-border bg-muted/30">
						<tr>
							{Array.from({ length: columns }).map((_, index) => (
								<th key={index} className="p-3 text-left">
									<Skeleton
										className={cn(
											"h-4",
											index === 0
												? "w-24"
												: index === columns - 1
													? "w-16"
													: "w-20",
										)}
									/>
								</th>
							))}
						</tr>
					</thead>
					{/* Table body */}
					<tbody>
						{Array.from({ length: rows }).map((_, rowIndex) => (
							<tr
								key={rowIndex}
								className={cn(
									"border-b border-border",
									SKELETON_HEIGHTS.TABLE_ROW,
								)}
							>
								{Array.from({ length: columns }).map((_, colIndex) => (
									<td key={colIndex} className="p-3">
										<Skeleton
											className={cn(
												"h-4",
												// Vary widths for visual interest
												rowIndex % 3 === 0 && "w-3/4",
												rowIndex % 3 === 1 && "w-full",
												rowIndex % 3 === 2 && "w-5/6",
											)}
										/>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Pagination skeleton */}
			<div className="flex items-center justify-between border-t border-border p-3">
				<Skeleton className="h-4 w-32" />
				<div className="flex items-center gap-2">
					<Skeleton className="h-8 w-8 rounded-md" />
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-8 w-8 rounded-md" />
				</div>
			</div>
		</div>
	);
}

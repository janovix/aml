"use client";

import * as React from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CompletenessResult } from "@/types/completeness";

interface CompletenessIndicatorProps {
	result: CompletenessResult;
	className?: string;
}

/**
 * Small inline 3-dot indicator showing SAT/Alert/KYC completeness.
 * Used in tables next to client names and operation rows.
 */
export function CompletenessIndicator({
	result,
	className,
}: CompletenessIndicatorProps): React.ReactElement {
	const { summary } = result;

	const redPct =
		summary.red.total > 0
			? (summary.red.filled / summary.red.total) * 100
			: 100;
	const yellowPct =
		summary.yellow.total > 0
			? (summary.yellow.filled / summary.yellow.total) * 100
			: 100;
	const greyPct =
		summary.grey.total > 0
			? (summary.grey.filled / summary.grey.total) * 100
			: 100;

	const tooltipText = `SAT: ${summary.red.filled}/${summary.red.total}, Alertas: ${summary.yellow.filled}/${summary.yellow.total}, KYC: ${summary.grey.filled}/${summary.grey.total}`;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div
						className={cn("inline-flex items-center gap-1", className)}
						aria-label={tooltipText}
					>
						<DotBar
							percentage={redPct}
							filledClass="bg-red-500"
							emptyClass="bg-red-200 dark:bg-red-900"
						/>
						<DotBar
							percentage={yellowPct}
							filledClass="bg-yellow-500"
							emptyClass="bg-yellow-200 dark:bg-yellow-900"
						/>
						<DotBar
							percentage={greyPct}
							filledClass="bg-gray-500"
							emptyClass="bg-gray-200 dark:bg-gray-800"
						/>
					</div>
				</TooltipTrigger>
				<TooltipContent side="top">
					<p className="text-xs">{tooltipText}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

function DotBar({
	percentage,
	filledClass,
	emptyClass,
}: {
	percentage: number;
	filledClass: string;
	emptyClass: string;
}) {
	return (
		<div
			className={cn(
				"h-2.5 w-2.5 rounded-full transition-colors",
				percentage >= 100 ? filledClass : emptyClass,
			)}
		/>
	);
}

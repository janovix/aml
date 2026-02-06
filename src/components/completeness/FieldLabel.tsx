"use client";

import * as React from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { FieldTier } from "@/types/completeness";
import { TIER_COLORS, TIER_HELPER_TEXT } from "@/types/completeness";

interface FieldLabelProps {
	/** The label text */
	children: React.ReactNode;
	/** Which tier this field belongs to */
	tier?: FieldTier;
	/** HTML for attribute */
	htmlFor?: string;
	/** Required indicator */
	required?: boolean;
	className?: string;
}

/**
 * Enhanced label component with a colored tier dot.
 * RED = SAT required, YELLOW = alert required, GREY = KYC optional.
 */
export function FieldLabel({
	children,
	tier,
	htmlFor,
	required,
	className,
}: FieldLabelProps): React.ReactElement {
	if (!tier) {
		return (
			<label
				htmlFor={htmlFor}
				className={cn(
					"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
					className,
				)}
			>
				{children}
				{required && <span className="text-red-500 ml-0.5">*</span>}
			</label>
		);
	}

	const tierColor = TIER_COLORS[tier];
	const helperText = TIER_HELPER_TEXT[tier];

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<label
						htmlFor={htmlFor}
						className={cn(
							"inline-flex items-center gap-1.5 text-sm font-medium leading-none cursor-help peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
							className,
						)}
					>
						<span
							className={cn("h-2 w-2 rounded-full shrink-0", tierColor.dot)}
							aria-hidden="true"
						/>
						{children}
						{required && <span className="text-red-500 ml-0.5">*</span>}
					</label>
				</TooltipTrigger>
				<TooltipContent side="top">
					<p className="text-xs">{helperText}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

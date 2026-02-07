"use client";

import type React from "react";
import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import type { FieldTier } from "@/types/completeness";
import { TIER_COLORS, TIER_HELPER_TEXT } from "@/types/completeness";
import { cn } from "@/lib/utils";

interface LabelWithInfoProps {
	htmlFor?: string;
	children: React.ReactNode;
	description?: string;
	required?: boolean;
	className?: string;
	/**
	 * Optional field tier for 3-tier completeness indicators.
	 * RED = SAT required, YELLOW = alert required, GREY = KYC optional.
	 * When set, a colored dot + tier tooltip is shown before the label text.
	 */
	tier?: FieldTier;
}

export function LabelWithInfo({
	htmlFor,
	children,
	description,
	required,
	className,
	tier,
}: LabelWithInfoProps): React.JSX.Element {
	// Render the tier dot as a tooltip
	const tierDot = tier ? (
		<Tooltip>
			<TooltipTrigger asChild>
				<span
					className={cn(
						"inline-block h-2 w-2 rounded-full shrink-0 cursor-help",
						TIER_COLORS[tier].dot,
					)}
					aria-label={TIER_HELPER_TEXT[tier]}
				/>
			</TooltipTrigger>
			<TooltipContent side="top" className="max-w-xs text-xs">
				{TIER_HELPER_TEXT[tier]}
			</TooltipContent>
		</Tooltip>
	) : null;

	// Render the info icon as a tooltip
	const infoIcon = description ? (
		<Tooltip>
			<TooltipTrigger asChild>
				<span
					role="img"
					aria-label="Información del campo"
					className="inline-flex items-center justify-center cursor-default"
				>
					<Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
				</span>
			</TooltipTrigger>
			<TooltipContent
				side="top"
				className="max-w-sm text-sm leading-relaxed"
				sideOffset={5}
			>
				<p className="whitespace-pre-wrap">{description}</p>
			</TooltipContent>
		</Tooltip>
	) : null;

	// If no enhancements, render a plain label
	if (!tier && !description) {
		return (
			<Label htmlFor={htmlFor} className={className}>
				{children}
				{required && <span className="text-destructive ml-1">*</span>}
			</Label>
		);
	}

	return (
		<div className="flex items-center gap-1.5">
			{tierDot}
			<Label htmlFor={htmlFor} className={className}>
				{children}
				{required && <span className="text-destructive ml-1">*</span>}
			</Label>
			{infoIcon}
		</div>
	);
}

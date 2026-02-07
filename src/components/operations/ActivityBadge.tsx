"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getActivityVisual } from "@/lib/activity-registry";
import type { ActivityCode } from "@/types/operation";

interface ActivityBadgeProps {
	code: ActivityCode;
	/** Show the full label or short label */
	variant?: "code" | "short" | "full";
	className?: string;
}

/**
 * Inline badge showing the activity icon, code, and label in a pill.
 * Used in tables, detail views, breadcrumbs.
 */
export function ActivityBadge({
	code,
	variant = "code",
	className,
}: ActivityBadgeProps): React.ReactElement {
	const visual = getActivityVisual(code);
	const Icon = visual.icon;

	const label =
		variant === "full"
			? visual.label
			: variant === "short"
				? visual.shortLabel
				: code;

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
				visual.color.badgeBg,
				visual.color.badgeText,
				visual.disabled && "opacity-50",
				className,
			)}
		>
			<Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
			<span className="truncate">{label}</span>
		</span>
	);
}

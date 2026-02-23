"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getActivityVisual } from "@/lib/activity-registry";
import type { ActivityCode } from "@/types/operation";

interface ActivityIconProps {
	code: ActivityCode;
	size?: "sm" | "md" | "lg";
	className?: string;
}

const SIZE_CLASSES = {
	sm: "h-4 w-4",
	md: "h-5 w-5",
	lg: "h-8 w-8",
};

/**
 * Just the activity icon with the correct color.
 * For use in sidebar, cards, and other compact contexts.
 */
export function ActivityIcon({
	code,
	size = "md",
	className,
}: ActivityIconProps): React.ReactElement {
	const visual = getActivityVisual(code);
	const Icon = visual.icon;

	return (
		<Icon
			className={cn(
				SIZE_CLASSES[size],
				visual.color.iconSelected,
				visual.disabled && "opacity-50",
				className,
			)}
			strokeWidth={size === "lg" ? 1.5 : 2}
		/>
	);
}

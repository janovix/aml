"use client";

import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/api/risk";

const GAUGE_COLORS: Record<RiskLevel, string> = {
	LOW: "text-emerald-500",
	MEDIUM_LOW: "text-lime-500",
	MEDIUM: "text-amber-500",
	MEDIUM_HIGH: "text-orange-500",
	HIGH: "text-red-500",
};

const GAUGE_TRACK: Record<RiskLevel, string> = {
	LOW: "stroke-emerald-500",
	MEDIUM_LOW: "stroke-lime-500",
	MEDIUM: "stroke-amber-500",
	MEDIUM_HIGH: "stroke-orange-500",
	HIGH: "stroke-red-500",
};

interface RiskScoreGaugeProps {
	score: number;
	maxScore?: number;
	level: RiskLevel;
	label?: string;
	size?: "sm" | "md" | "lg";
	className?: string;
}

export function RiskScoreGauge({
	score,
	maxScore = 10,
	level,
	label,
	size = "md",
	className,
}: RiskScoreGaugeProps) {
	const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
	const radius = size === "sm" ? 28 : size === "md" ? 36 : 44;
	const strokeWidth = size === "sm" ? 4 : 5;
	const circumference = 2 * Math.PI * radius;
	const dashOffset = circumference - (percentage / 100) * circumference;
	const svgSize = (radius + strokeWidth) * 2;

	return (
		<div className={cn("flex flex-col items-center gap-1", className)}>
			<div className="relative" style={{ width: svgSize, height: svgSize }}>
				<svg
					width={svgSize}
					height={svgSize}
					className="-rotate-90"
					aria-hidden="true"
				>
					<circle
						cx={radius + strokeWidth}
						cy={radius + strokeWidth}
						r={radius}
						fill="none"
						stroke="currentColor"
						strokeWidth={strokeWidth}
						className="text-muted/30"
					/>
					<circle
						cx={radius + strokeWidth}
						cy={radius + strokeWidth}
						r={radius}
						fill="none"
						strokeWidth={strokeWidth}
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={dashOffset}
						className={cn(
							"transition-all duration-700 ease-out",
							GAUGE_TRACK[level],
						)}
					/>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<span
						className={cn(
							"font-bold tabular-nums",
							GAUGE_COLORS[level],
							size === "sm" && "text-sm",
							size === "md" && "text-lg",
							size === "lg" && "text-2xl",
						)}
					>
						{score.toFixed(1)}
					</span>
				</div>
			</div>
			{label && (
				<span className="text-xs font-medium text-muted-foreground text-center">
					{label}
				</span>
			)}
		</div>
	);
}

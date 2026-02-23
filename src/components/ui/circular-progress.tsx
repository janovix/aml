"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
	/** Progress percentage (0-100) */
	percentage: number;
	/** Size in pixels */
	size?: number;
	/** Stroke width in pixels */
	strokeWidth?: number;
	/** Show check icon when complete */
	showCheckWhenComplete?: boolean;
	/** Additional class names */
	className?: string;
}

// Returns Tailwind class + raw hex for glow filter
function getColorConfig(percentage: number, isComplete: boolean) {
	if (isComplete) return { textClass: "text-green-500", hex: "#22c55e" };
	if (percentage <= 25) return { textClass: "text-red-500", hex: "#ef4444" };
	if (percentage <= 50) return { textClass: "text-orange-500", hex: "#f97316" };
	if (percentage <= 75) return { textClass: "text-amber-500", hex: "#f59e0b" };
	return { textClass: "text-emerald-500", hex: "#10b981" };
}

export function CircularProgress({
	percentage,
	size = 64,
	strokeWidth = 6,
	showCheckWhenComplete = true,
	className,
}: CircularProgressProps) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const targetOffset = circumference - (percentage / 100) * circumference;
	const isComplete = percentage === 100;
	const showText = size >= 36;
	const glowBlur = size <= 30 ? 1.5 : size <= 50 ? 2.5 : 4;

	const { textClass, hex } = getColorConfig(percentage, isComplete);

	// Animate stroke on mount: start fully empty, transition to target offset
	const [offset, setOffset] = React.useState(circumference);
	React.useEffect(() => {
		const id = requestAnimationFrame(() => setOffset(targetOffset));
		return () => cancelAnimationFrame(id);
	}, [targetOffset]);

	if (isComplete && showCheckWhenComplete) {
		return (
			<div
				className={cn("inline-flex items-center justify-center", className)}
				style={{ width: size, height: size }}
			>
				<div
					className="rounded-full bg-green-500 p-2.5"
					style={{
						boxShadow: `0 0 ${glowBlur * 2}px #22c55e66`,
					}}
				>
					<Check
						style={{ width: size * 0.42, height: size * 0.42 }}
						className="text-white"
						strokeWidth={3}
					/>
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"relative inline-flex items-center justify-center",
				className,
			)}
		>
			<svg width={size} height={size} className="-rotate-90">
				{/* Subtle colored disc fill */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill={hex}
					fillOpacity={0.08}
					stroke="none"
				/>
				{/* Background track */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="currentColor"
					strokeWidth={strokeWidth}
					className="text-muted opacity-30"
				/>
				{/* Progress arc */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={hex}
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					strokeLinecap="round"
					className="transition-all duration-700 ease-out"
					style={{
						filter: `drop-shadow(0 0 ${glowBlur}px ${hex}99)`,
					}}
				/>
			</svg>

			{/* Center percentage — only at large sizes */}
			{showText && (
				<div className="absolute inset-0 flex items-center justify-center">
					<span
						className={cn(
							"font-semibold tabular-nums",
							textClass,
							size >= 60 ? "text-sm" : "text-[10px]",
						)}
					>
						{percentage}%
					</span>
				</div>
			)}
		</div>
	);
}

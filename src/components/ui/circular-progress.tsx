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

export function CircularProgress({
	percentage,
	size = 64,
	strokeWidth = 6,
	showCheckWhenComplete = true,
	className,
}: CircularProgressProps) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (percentage / 100) * circumference;
	const isComplete = percentage === 100;

	// Determine color based on percentage
	const getColor = () => {
		if (isComplete) return "text-green-500";
		if (percentage >= 75) return "text-yellow-500";
		if (percentage >= 50) return "text-yellow-600";
		return "text-amber-500";
	};

	const colorClass = getColor();

	return (
		<div
			className={cn(
				"relative inline-flex items-center justify-center",
				className,
			)}
		>
			<svg width={size} height={size} className="transform -rotate-90">
				{/* Background circle */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="currentColor"
					strokeWidth={strokeWidth}
					className="text-muted opacity-20"
				/>
				{/* Progress circle */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="currentColor"
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					strokeLinecap="round"
					className={cn("transition-all duration-500 ease-out", colorClass)}
				/>
			</svg>
			{/* Center content */}
			<div className="absolute inset-0 flex items-center justify-center">
				{isComplete && showCheckWhenComplete ? (
					<div className={cn("rounded-full bg-green-500 p-2")}>
						<Check className="h-5 w-5 text-white" strokeWidth={3} />
					</div>
				) : (
					<span className={cn("text-sm font-semibold", colorClass)}>
						{percentage}%
					</span>
				)}
			</div>
		</div>
	);
}

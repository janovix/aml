"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight chart components for report visualization
 * Uses pure SVG for minimal bundle size and no external dependencies
 */

interface ChartData {
	label: string;
	value: number;
	color?: string;
}

interface TimeSeriesData {
	date: string;
	value: number;
	label?: string;
}

// Default color palette
const DEFAULT_COLORS = [
	"#3b82f6", // blue
	"#10b981", // emerald
	"#f59e0b", // amber
	"#ef4444", // red
	"#8b5cf6", // violet
	"#06b6d4", // cyan
	"#ec4899", // pink
	"#6b7280", // gray
];

// Severity colors
export const SEVERITY_COLORS: Record<string, string> = {
	LOW: "#6b7280",
	MEDIUM: "#f59e0b",
	HIGH: "#f97316",
	CRITICAL: "#ef4444",
};

// Status colors
export const STATUS_COLORS: Record<string, string> = {
	DETECTED: "#3b82f6",
	FILE_GENERATED: "#06b6d4",
	SUBMITTED: "#8b5cf6",
	OVERDUE: "#ef4444",
	CANCELLED: "#6b7280",
};

interface PieChartProps {
	data: ChartData[];
	width?: number;
	height?: number;
	title?: string;
	showLegend?: boolean;
	className?: string;
}

/**
 * Interactive Pie Chart component
 */
export function PieChart({
	data,
	width = 200,
	height = 200,
	title,
	showLegend = true,
	className,
}: PieChartProps) {
	const total = useMemo(
		() => data.reduce((sum, item) => sum + item.value, 0),
		[data],
	);

	const segments = useMemo(() => {
		let startAngle = -90; // Start from top
		return data.map((item, index) => {
			const percentage = total > 0 ? item.value / total : 0;
			const angle = percentage * 360;
			const endAngle = startAngle + angle;

			const segment = {
				...item,
				color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
				percentage,
				startAngle,
				endAngle,
			};

			startAngle = endAngle;
			return segment;
		});
	}, [data, total]);

	const cx = width / 2;
	const cy = height / 2;
	const radius = Math.min(width, height) / 2 - 10;

	const createArcPath = (startAngle: number, endAngle: number) => {
		const startRad = (startAngle * Math.PI) / 180;
		const endRad = (endAngle * Math.PI) / 180;

		const x1 = cx + radius * Math.cos(startRad);
		const y1 = cy + radius * Math.sin(startRad);
		const x2 = cx + radius * Math.cos(endRad);
		const y2 = cy + radius * Math.sin(endRad);

		const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

		return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
	};

	return (
		<div className={cn("flex flex-col gap-3", className)}>
			{title && (
				<h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
			)}
			<div className="flex items-center gap-4">
				<svg
					width={width}
					height={height}
					viewBox={`0 0 ${width} ${height}`}
					className="flex-shrink-0"
				>
					{segments.map((segment, index) => (
						<path
							key={index}
							d={createArcPath(segment.startAngle, segment.endAngle)}
							fill={segment.color}
							className="transition-opacity hover:opacity-80 cursor-pointer"
						>
							<title>
								{segment.label}: {segment.value} (
								{(segment.percentage * 100).toFixed(1)}%)
							</title>
						</path>
					))}
					{/* Center text showing total */}
					<text
						x={cx}
						y={cy}
						textAnchor="middle"
						dominantBaseline="central"
						className="text-lg font-bold fill-foreground"
					>
						{total}
					</text>
				</svg>

				{showLegend && (
					<div className="flex flex-col gap-1.5">
						{segments.map((segment, index) => (
							<div key={index} className="flex items-center gap-2 text-sm">
								<span
									className="w-3 h-3 rounded-sm flex-shrink-0"
									style={{ backgroundColor: segment.color }}
								/>
								<span className="text-muted-foreground truncate max-w-24">
									{segment.label}
								</span>
								<span className="font-medium tabular-nums">
									{segment.value}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

interface DonutChartProps extends PieChartProps {
	innerRadius?: number;
	centerLabel?: string;
	centerValue?: string | number;
}

/**
 * Interactive Donut Chart component
 */
export function DonutChart({
	data,
	width = 200,
	height = 200,
	title,
	showLegend = true,
	innerRadius = 0.6,
	centerLabel,
	centerValue,
	className,
}: DonutChartProps) {
	const total = useMemo(
		() => data.reduce((sum, item) => sum + item.value, 0),
		[data],
	);

	const segments = useMemo(() => {
		let startAngle = -90;
		return data.map((item, index) => {
			const percentage = total > 0 ? item.value / total : 0;
			const angle = percentage * 360;
			const endAngle = startAngle + angle;

			const segment = {
				...item,
				color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
				percentage,
				startAngle,
				endAngle,
			};

			startAngle = endAngle;
			return segment;
		});
	}, [data, total]);

	const cx = width / 2;
	const cy = height / 2;
	const outerRadius = Math.min(width, height) / 2 - 10;
	const innerR = outerRadius * innerRadius;

	const createDonutPath = (startAngle: number, endAngle: number) => {
		const startRad = (startAngle * Math.PI) / 180;
		const endRad = (endAngle * Math.PI) / 180;

		const outerX1 = cx + outerRadius * Math.cos(startRad);
		const outerY1 = cy + outerRadius * Math.sin(startRad);
		const outerX2 = cx + outerRadius * Math.cos(endRad);
		const outerY2 = cy + outerRadius * Math.sin(endRad);

		const innerX1 = cx + innerR * Math.cos(endRad);
		const innerY1 = cy + innerR * Math.sin(endRad);
		const innerX2 = cx + innerR * Math.cos(startRad);
		const innerY2 = cy + innerR * Math.sin(startRad);

		const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

		return `
			M ${outerX1} ${outerY1}
			A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}
			L ${innerX1} ${innerY1}
			A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${innerX2} ${innerY2}
			Z
		`;
	};

	return (
		<div className={cn("flex flex-col gap-3", className)}>
			{title && (
				<h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
			)}
			<div className="flex items-center gap-4">
				<svg
					width={width}
					height={height}
					viewBox={`0 0 ${width} ${height}`}
					className="flex-shrink-0"
				>
					{segments.map((segment, index) => (
						<path
							key={index}
							d={createDonutPath(segment.startAngle, segment.endAngle)}
							fill={segment.color}
							className="transition-opacity hover:opacity-80 cursor-pointer"
						>
							<title>
								{segment.label}: {segment.value} (
								{(segment.percentage * 100).toFixed(1)}%)
							</title>
						</path>
					))}
					{/* Center content */}
					{(centerLabel || centerValue !== undefined) && (
						<>
							{centerValue !== undefined && (
								<text
									x={cx}
									y={centerLabel ? cy - 8 : cy}
									textAnchor="middle"
									dominantBaseline="central"
									className="text-2xl font-bold fill-foreground"
								>
									{centerValue}
								</text>
							)}
							{centerLabel && (
								<text
									x={cx}
									y={centerValue !== undefined ? cy + 12 : cy}
									textAnchor="middle"
									dominantBaseline="central"
									className="text-xs fill-muted-foreground"
								>
									{centerLabel}
								</text>
							)}
						</>
					)}
				</svg>

				{showLegend && (
					<div className="flex flex-col gap-1.5">
						{segments.map((segment, index) => (
							<div key={index} className="flex items-center gap-2 text-sm">
								<span
									className="w-3 h-3 rounded-sm flex-shrink-0"
									style={{ backgroundColor: segment.color }}
								/>
								<span className="text-muted-foreground truncate max-w-24">
									{segment.label}
								</span>
								<span className="font-medium tabular-nums">
									{segment.value}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

interface BarChartProps {
	data: ChartData[];
	width?: number;
	height?: number;
	title?: string;
	horizontal?: boolean;
	showValues?: boolean;
	className?: string;
}

/**
 * Interactive Bar Chart component
 */
export function BarChart({
	data,
	width = 300,
	height = 200,
	title,
	horizontal = false,
	showValues = true,
	className,
}: BarChartProps) {
	const maxValue = useMemo(
		() => Math.max(...data.map((d) => d.value), 1),
		[data],
	);

	const padding = { top: 20, right: 20, bottom: 30, left: 40 };
	const chartWidth = width - padding.left - padding.right;
	const chartHeight = height - padding.top - padding.bottom;

	if (horizontal) {
		const barHeight = Math.min(30, chartHeight / data.length - 4);

		return (
			<div className={cn("flex flex-col gap-3", className)}>
				{title && (
					<h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
				)}
				<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
					<g transform={`translate(${padding.left}, ${padding.top})`}>
						{data.map((item, index) => {
							const barWidth = (item.value / maxValue) * chartWidth;
							const y = index * (barHeight + 4);
							const color =
								item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

							return (
								<g key={index}>
									<rect
										x={0}
										y={y}
										width={barWidth}
										height={barHeight}
										fill={color}
										rx={4}
										className="transition-opacity hover:opacity-80 cursor-pointer"
									>
										<title>
											{item.label}: {item.value}
										</title>
									</rect>
									{showValues && (
										<text
											x={barWidth + 5}
											y={y + barHeight / 2}
											dominantBaseline="central"
											className="text-xs fill-muted-foreground"
										>
											{item.value}
										</text>
									)}
								</g>
							);
						})}
					</g>
					{/* Y-axis labels */}
					<g transform={`translate(0, ${padding.top})`}>
						{data.map((item, index) => {
							const barHeight = Math.min(30, chartHeight / data.length - 4);
							const y = index * (barHeight + 4) + barHeight / 2;

							return (
								<text
									key={index}
									x={padding.left - 5}
									y={y}
									textAnchor="end"
									dominantBaseline="central"
									className="text-xs fill-muted-foreground"
								>
									{item.label.slice(0, 10)}
								</text>
							);
						})}
					</g>
				</svg>
			</div>
		);
	}

	// Vertical bar chart
	const barWidth = Math.min(40, chartWidth / data.length - 8);

	return (
		<div className={cn("flex flex-col gap-3", className)}>
			{title && (
				<h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
			)}
			<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
				<g transform={`translate(${padding.left}, ${padding.top})`}>
					{data.map((item, index) => {
						const barHeight = (item.value / maxValue) * chartHeight;
						const x =
							index * (chartWidth / data.length) +
							(chartWidth / data.length - barWidth) / 2;
						const y = chartHeight - barHeight;
						const color =
							item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

						return (
							<g key={index}>
								<rect
									x={x}
									y={y}
									width={barWidth}
									height={barHeight}
									fill={color}
									rx={4}
									className="transition-opacity hover:opacity-80 cursor-pointer"
								>
									<title>
										{item.label}: {item.value}
									</title>
								</rect>
								{showValues && (
									<text
										x={x + barWidth / 2}
										y={y - 5}
										textAnchor="middle"
										className="text-xs fill-muted-foreground"
									>
										{item.value}
									</text>
								)}
							</g>
						);
					})}
				</g>
				{/* X-axis labels */}
				<g transform={`translate(${padding.left}, ${height - 10})`}>
					{data.map((item, index) => {
						const x =
							index * (chartWidth / data.length) + chartWidth / data.length / 2;

						return (
							<text
								key={index}
								x={x}
								y={0}
								textAnchor="middle"
								className="text-xs fill-muted-foreground"
							>
								{item.label.slice(0, 8)}
							</text>
						);
					})}
				</g>
			</svg>
		</div>
	);
}

interface LineChartProps {
	data: TimeSeriesData[];
	width?: number;
	height?: number;
	title?: string;
	color?: string;
	showPoints?: boolean;
	showArea?: boolean;
	className?: string;
}

/**
 * Interactive Line Chart component
 */
export function LineChart({
	data,
	width = 300,
	height = 200,
	title,
	color = "#3b82f6",
	showPoints = true,
	showArea = true,
	className,
}: LineChartProps) {
	const padding = { top: 20, right: 20, bottom: 30, left: 40 };
	const chartWidth = width - padding.left - padding.right;
	const chartHeight = height - padding.top - padding.bottom;

	const { maxValue, minValue, points, linePath, areaPath } = useMemo(() => {
		if (data.length === 0) {
			return {
				maxValue: 0,
				minValue: 0,
				points: [],
				linePath: "",
				areaPath: "",
			};
		}

		const max = Math.max(...data.map((d) => d.value)) * 1.1;
		const min = Math.min(...data.map((d) => d.value)) * 0.9;
		const range = max - min || 1;

		const pts = data.map((item, index) => ({
			x: (index / (data.length - 1 || 1)) * chartWidth,
			y: chartHeight - ((item.value - min) / range) * chartHeight,
			...item,
		}));

		const line = pts
			.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
			.join(" ");
		const area = `${line} L ${pts[pts.length - 1].x} ${chartHeight} L ${pts[0].x} ${chartHeight} Z`;

		return {
			maxValue: max,
			minValue: min,
			points: pts,
			linePath: line,
			areaPath: area,
		};
	}, [data, chartWidth, chartHeight]);

	return (
		<div className={cn("flex flex-col gap-3", className)}>
			{title && (
				<h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
			)}
			<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
				<g transform={`translate(${padding.left}, ${padding.top})`}>
					{/* Grid lines */}
					{[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
						<line
							key={ratio}
							x1={0}
							y1={chartHeight * ratio}
							x2={chartWidth}
							y2={chartHeight * ratio}
							stroke="currentColor"
							strokeOpacity={0.1}
						/>
					))}

					{/* Area fill */}
					{showArea && <path d={areaPath} fill={color} fillOpacity={0.1} />}

					{/* Line */}
					<path
						d={linePath}
						fill="none"
						stroke={color}
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>

					{/* Points */}
					{showPoints &&
						points.map((point, index) => (
							<circle
								key={index}
								cx={point.x}
								cy={point.y}
								r={4}
								fill={color}
								className="transition-all hover:r-6 cursor-pointer"
							>
								<title>
									{point.label || point.date}: {point.value}
								</title>
							</circle>
						))}
				</g>

				{/* X-axis labels */}
				<g transform={`translate(${padding.left}, ${height - 10})`}>
					{points
						.filter(
							(_, i) =>
								i === 0 ||
								i === points.length - 1 ||
								i === Math.floor(points.length / 2),
						)
						.map((point, index) => (
							<text
								key={index}
								x={point.x}
								y={0}
								textAnchor="middle"
								className="text-xs fill-muted-foreground"
							>
								{point.label || point.date}
							</text>
						))}
				</g>
			</svg>
		</div>
	);
}

interface MetricCardProps {
	label: string;
	value: string | number;
	change?: number;
	icon?: React.ReactNode;
	color?: string;
	className?: string;
}

/**
 * Metric card with optional change indicator
 */
export function MetricCard({
	label,
	value,
	change,
	icon,
	color = "primary",
	className,
}: MetricCardProps) {
	return (
		<div className={cn("p-4 rounded-lg border bg-card", className)}>
			<div className="flex items-center justify-between mb-2">
				<span className="text-sm text-muted-foreground">{label}</span>
				{icon && <span className="text-muted-foreground">{icon}</span>}
			</div>
			<div className="flex items-end justify-between">
				<span className={cn("text-2xl font-bold", `text-${color}`)}>
					{value}
				</span>
				{change !== undefined && (
					<span
						className={cn(
							"text-sm font-medium",
							change > 0 && "text-red-500",
							change < 0 && "text-green-500",
							change === 0 && "text-muted-foreground",
						)}
					>
						{change > 0 ? "↑" : change < 0 ? "↓" : "→"} {Math.abs(change)}%
					</span>
				)}
			</div>
		</div>
	);
}

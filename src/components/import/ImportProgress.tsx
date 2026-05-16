"use client";

import {
	CheckCircle2,
	AlertTriangle,
	XCircle,
	Clock,
	SkipForward,
	FileSpreadsheet,
	RotateCcw,
	X,
	Users,
	Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ImportState } from "@/types/import";
import { useLanguage } from "@/components/LanguageProvider";

interface ImportProgressProps {
	state: ImportState;
	onReset: () => void;
}

/**
 * Circular Progress component
 */
function CircularProgress({
	progress,
	isComplete,
	isFailed,
	indeterminate,
	size = 80,
	strokeWidth = 6,
}: {
	progress: number;
	isComplete: boolean;
	isFailed: boolean;
	indeterminate?: boolean;
	size?: number;
	strokeWidth?: number;
}) {
	const radius = (size - strokeWidth) / 2;

	if (indeterminate) {
		return (
			<div
				className="relative flex items-center justify-center"
				style={{ width: size, height: size }}
				aria-busy
				aria-valuetext="Loading"
			>
				<svg
					className="transform -rotate-90 text-muted/30"
					width={size}
					height={size}
					aria-hidden
				>
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke="currentColor"
						strokeWidth={strokeWidth}
						fill="none"
					/>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<Loader2
						className={cn(
							"h-7 w-7 animate-spin",
							isFailed ? "text-destructive" : "text-primary",
						)}
						aria-hidden
					/>
				</div>
			</div>
		);
	}

	const circumference = radius * 2 * Math.PI;
	const offset = circumference - (progress / 100) * circumference;

	return (
		<div className="relative" style={{ width: size, height: size }}>
			{/* Background circle */}
			<svg className="transform -rotate-90" width={size} height={size}>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke="currentColor"
					strokeWidth={strokeWidth}
					fill="none"
					className="text-muted/30"
				/>
				{/* Progress circle */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke="currentColor"
					strokeWidth={strokeWidth}
					fill="none"
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					className={cn(
						"transition-all duration-500 ease-out",
						isFailed
							? "text-destructive"
							: isComplete
								? "text-green-500"
								: "text-primary",
					)}
				/>
			</svg>
			{/* Center content */}
			<div className="absolute inset-0 flex items-center justify-center">
				<span
					className={cn(
						"text-lg font-bold tabular-nums",
						isFailed
							? "text-destructive"
							: isComplete
								? "text-green-500"
								: "text-foreground",
					)}
				>
					{Math.round(progress)}%
				</span>
			</div>
		</div>
	);
}

export function ImportProgress({ state, onReset }: ImportProgressProps) {
	const { t } = useLanguage();
	const progress =
		state.totalRows > 0
			? Math.min((state.processedRows / state.totalRows) * 100, 100)
			: 0;
	const isComplete = state.status === "completed";
	const isFailed = state.status === "failed";
	const showIndeterminate =
		state.totalRows === 0 &&
		!isComplete &&
		!isFailed &&
		(state.status === "queued" ||
			state.status === "validating" ||
			state.status === "processing" ||
			state.status === "uploading");

	const allStatItems = [
		{
			value: state.successCount,
			icon: CheckCircle2,
			color: "text-green-500",
			bgColor: "bg-green-500/10",
			borderColor: "border-green-500/20",
			label: "Exitosos",
			alwaysShow: true,
		},
		{
			value: state.warningCount,
			icon: AlertTriangle,
			color: "text-amber-500",
			bgColor: "bg-amber-500/10",
			borderColor: "border-amber-500/20",
			label: "Advertencias",
			alwaysShow: true,
		},
		{
			value: state.errorCount,
			icon: XCircle,
			color: "text-red-500",
			bgColor: "bg-red-500/10",
			borderColor: "border-red-500/20",
			label: "Errores",
			alwaysShow: true,
		},
		{
			value: state.skippedCount,
			icon: SkipForward,
			color: "text-amber-500",
			bgColor: "bg-amber-500/10",
			borderColor: "border-amber-500/20",
			label: "Omitidos",
			alwaysShow: false,
		},
		{
			value: state.totalRows - state.processedRows,
			icon: Clock,
			color: "text-muted-foreground",
			bgColor: "bg-muted/50",
			borderColor: "border-muted",
			label: "Pendientes",
			alwaysShow: true,
		},
	];

	const statItems = allStatItems.filter(
		(item) => item.alwaysShow || item.value > 0,
	);

	const getStatusText = () => {
		if (isFailed) return t("importsStatusFailed");
		if (isComplete) return t("importsStatusComplete");
		if (state.status === "queued") return t("importsStatusQueued");
		if (state.status === "validating") return t("importsStatusValidating");
		if (state.status === "uploading") return t("importsStatusUploading");
		if (state.status === "processing") {
			if (state.totalRows > 0) {
				return t("importsStatusProcessingRow")
					.replace("{current}", String(state.processedRows))
					.replace("{total}", String(state.totalRows));
			}
			return t("importsStatusPreparing");
		}
		return t("importsStatusPreparing");
	};

	const EntityIcon = state.entityType === "OPERATION" ? FileSpreadsheet : Users;

	return (
		<Card className="bg-card border-border overflow-hidden relative">
			<CardContent className="p-4">
				{/* Close button - absolute positioned */}
				<div className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 sm:hidden">
					<Button
						variant="ghost"
						size="icon"
						onClick={onReset}
						className="text-muted-foreground hover:text-foreground h-8 w-8"
					>
						<X className="h-4 w-4" />
						<span className="sr-only">Cerrar</span>
					</Button>
				</div>

				<div className="flex flex-col sm:flex-row sm:items-start gap-4">
					{/* Top row on mobile: Progress + File info */}
					<div className="flex items-center gap-4">
						{/* Circular Progress */}
						<div className="shrink-0">
							<CircularProgress
								progress={progress}
								isComplete={isComplete}
								isFailed={isFailed}
								indeterminate={showIndeterminate}
							/>
						</div>

						{/* File info - shown inline on mobile */}
						<div className="flex-1 min-w-0 sm:hidden">
							<div className="flex items-center gap-2 mb-1">
								<div
									className={cn(
										"p-1.5 rounded-md",
										isComplete
											? "bg-green-500/10"
											: isFailed
												? "bg-destructive/10"
												: "bg-primary/10",
									)}
								>
									<EntityIcon
										className={cn(
											"h-4 w-4",
											isComplete
												? "text-green-500"
												: isFailed
													? "text-destructive"
													: "text-primary",
										)}
									/>
								</div>
								<h3 className="font-semibold text-foreground truncate text-sm">
									{state.fileName ?? ""}
								</h3>
							</div>
							<p className="text-sm text-muted-foreground">{getStatusText()}</p>
						</div>
					</div>

					{/* Middle: Info - full width on mobile */}
					<div className="flex-1 min-w-0">
						{/* File info - hidden on mobile, shown on sm+ */}
						<div className="hidden sm:block mb-3">
							<div className="flex items-center gap-2 mb-1">
								<div
									className={cn(
										"p-1.5 rounded-md",
										isComplete
											? "bg-green-500/10"
											: isFailed
												? "bg-destructive/10"
												: "bg-primary/10",
									)}
								>
									<EntityIcon
										className={cn(
											"h-4 w-4",
											isComplete
												? "text-green-500"
												: isFailed
													? "text-destructive"
													: "text-primary",
										)}
									/>
								</div>
								<h3 className="font-semibold text-foreground truncate">
									{state.fileName ?? ""}
								</h3>
							</div>
							<p className="text-sm text-muted-foreground">{getStatusText()}</p>
						</div>

						{/* Stats grid */}
						<div
							className={cn(
								"grid gap-1.5 sm:gap-2",
								statItems.length <= 4 ? "grid-cols-4" : "grid-cols-5",
							)}
						>
							{statItems.map((item, idx) => (
								<div
									key={idx}
									className={cn(
										"flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-lg border",
										item.bgColor,
										item.borderColor,
									)}
								>
									<item.icon
										className={cn(
											"h-3.5 w-3.5 sm:h-4 sm:w-4 mb-0.5 sm:mb-1",
											item.color,
										)}
									/>
									<span
										className={cn(
											"text-base sm:text-lg font-bold tabular-nums",
											item.color,
										)}
									>
										{item.value}
									</span>
									<span className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wide text-center leading-tight">
										{item.label}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Right: Actions - hidden on mobile */}
					<div className="hidden sm:flex shrink-0 flex-col gap-1">
						{isComplete && (
							<Button
								variant="outline"
								size="sm"
								onClick={onReset}
								className="gap-1.5"
							>
								<RotateCcw className="h-3.5 w-3.5" />
								Nuevo
							</Button>
						)}
						<Button
							variant="ghost"
							size="icon"
							onClick={onReset}
							className="text-muted-foreground hover:text-foreground h-8 w-8"
						>
							<X className="h-4 w-4" />
							<span className="sr-only">Cerrar</span>
						</Button>
					</div>
				</div>

				{/* Mobile action buttons */}
				{isComplete && (
					<div className="mt-3 sm:hidden">
						<Button
							variant="outline"
							size="sm"
							onClick={onReset}
							className="w-full gap-1.5"
						>
							<RotateCcw className="h-3.5 w-3.5" />
							Nueva importación
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

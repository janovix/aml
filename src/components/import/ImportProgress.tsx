"use client";

import {
	CheckCircle2,
	AlertTriangle,
	XCircle,
	Clock,
	FileSpreadsheet,
	RotateCcw,
	X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ImportState } from "@/types/import";

interface ImportProgressProps {
	state: ImportState;
	onReset: () => void;
}

export function ImportProgress({ state, onReset }: ImportProgressProps) {
	const progress =
		state.totalRows > 0
			? Math.min((state.processedRows / state.totalRows) * 100, 100)
			: 0;
	const isComplete = state.status === "completed";
	const isFailed = state.status === "failed";

	const statItems = [
		{
			value: state.successCount,
			icon: CheckCircle2,
			color: "text-success",
			bgColor: "bg-success/10",
			label: "Exitosos",
		},
		{
			value: state.warningCount,
			icon: AlertTriangle,
			color: "text-warning",
			bgColor: "bg-warning/10",
			label: "Advertencias",
		},
		{
			value: state.errorCount,
			icon: XCircle,
			color: "text-destructive",
			bgColor: "bg-destructive/10",
			label: "Errores",
		},
		{
			value: state.totalRows - state.processedRows,
			icon: Clock,
			color: "text-muted-foreground",
			bgColor: "bg-muted",
			label: "Pendientes",
		},
	];

	const getStatusText = () => {
		if (isFailed) return "Importación fallida";
		if (isComplete) return "Importación completada";
		if (state.status === "processing")
			return `Fila ${state.processedRows} de ${state.totalRows}`;
		if (state.status === "uploading") return "Subiendo archivo...";
		return "Preparando...";
	};

	return (
		<div className="space-y-3">
			{/* Progress Card */}
			<Card className="bg-card border-border">
				<CardContent className="p-3">
					<div className="flex items-center justify-between gap-3 mb-3">
						<div className="flex items-center gap-2 min-w-0 flex-1">
							<div
								className={cn(
									"p-1.5 rounded-lg flex-shrink-0",
									isComplete
										? "bg-success/10"
										: isFailed
											? "bg-destructive/10"
											: "bg-primary/10",
								)}
							>
								<FileSpreadsheet
									className={cn(
										"h-4 w-4",
										isComplete
											? "text-success"
											: isFailed
												? "text-destructive"
												: "text-primary",
									)}
								/>
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="font-medium text-foreground text-sm truncate">
									{state.fileName}
								</h3>
								<p className="text-xs text-muted-foreground">
									{getStatusText()}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-1 flex-shrink-0">
							{isComplete && (
								<Button
									variant="outline"
									size="sm"
									onClick={onReset}
									className="gap-1 bg-transparent text-xs h-7 hidden sm:flex"
								>
									<RotateCcw className="h-3 w-3" />
									<span>Nuevo</span>
								</Button>
							)}
							<Button
								variant="ghost"
								size="icon"
								onClick={onReset}
								className="text-muted-foreground hover:text-foreground h-7 w-7"
							>
								<X className="h-4 w-4" />
								<span className="sr-only">Cancelar</span>
							</Button>
						</div>
					</div>

					<div className="space-y-1">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">Progreso</span>
							<span className="font-medium text-foreground">
								{Math.round(progress)}%
							</span>
						</div>
						<Progress
							value={progress}
							className={cn(
								"h-1.5 bg-secondary",
								!isComplete && !isFailed && "animate-pulse",
							)}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Stats Bar */}
			<Card className="bg-card border-border">
				<CardContent className="p-2">
					<div className="flex items-center justify-between gap-1">
						{statItems.map((item, idx) => (
							<div
								key={idx}
								className={cn(
									"flex items-center gap-1.5 px-2 py-1.5 rounded-md flex-1 justify-center",
									item.bgColor,
								)}
								title={item.label}
							>
								<item.icon className={cn("h-3.5 w-3.5", item.color)} />
								<span className={cn("text-sm font-semibold", item.color)}>
									{item.value}
								</span>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

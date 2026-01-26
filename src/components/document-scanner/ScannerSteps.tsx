"use client";

import { cn } from "@/lib/utils";
import {
	Check,
	Target,
	Move,
	Highlighter,
	FileOutput,
	ScanSearch,
} from "lucide-react";
import type { ScannerStage } from "@/lib/document-scanner/types";

interface ScannerStepsProps {
	currentStage: ScannerStage;
	className?: string;
}

interface StepConfig {
	id: ScannerStage;
	label: string;
	shortLabel: string;
	icon: React.ElementType;
}

const STEPS: StepConfig[] = [
	{
		id: "detecting",
		label: "Detectar Esquinas",
		shortLabel: "Detectar",
		icon: Target,
	},
	{
		id: "adjusting",
		label: "Ajustar Esquinas",
		shortLabel: "Ajustar",
		icon: Move,
	},
	{
		id: "highlighting",
		label: "Previsualizar",
		shortLabel: "Preview",
		icon: Highlighter,
	},
	{
		id: "extracting",
		label: "Extraer Documento",
		shortLabel: "Extraer",
		icon: FileOutput,
	},
	{
		id: "validating",
		label: "Validar OCR",
		shortLabel: "Validar",
		icon: ScanSearch,
	},
];

const STAGE_ORDER: Record<ScannerStage, number> = {
	idle: -1,
	detecting: 0,
	adjusting: 1,
	highlighting: 2,
	extracting: 3,
	validating: 4,
	waiting_for_back: 4.5, // Between validating and complete (INE only)
	complete: 5,
};

export function ScannerSteps({ currentStage, className }: ScannerStepsProps) {
	const currentIndex = STAGE_ORDER[currentStage];

	return (
		<div className={cn("w-full", className)}>
			<div className="flex items-start justify-between">
				{STEPS.map((step, index) => {
					const stepIndex = STAGE_ORDER[step.id];
					const isCompleted = currentIndex > stepIndex;
					const isCurrent = currentIndex === stepIndex;
					const isLast = index === STEPS.length - 1;
					const Icon = step.icon;

					return (
						<div key={step.id} className="flex items-center flex-1">
							<div className="flex flex-col items-center">
								{/* Step circle - smaller on mobile */}
								<div
									className={cn(
										"flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-all",
										isCompleted && "border-green-500 bg-green-500 text-white",
										isCurrent &&
											"border-primary bg-primary/10 text-primary animate-pulse",
										!isCompleted &&
											!isCurrent &&
											"border-muted-foreground/30 text-muted-foreground",
									)}
								>
									{isCompleted ? (
										<Check className="h-4 w-4 sm:h-5 sm:w-5" />
									) : (
										<Icon className="h-4 w-4 sm:h-5 sm:w-5" />
									)}
								</div>

								{/* Step label */}
								<div className="mt-1 sm:mt-2 text-center">
									<p
										className={cn(
											"text-xs font-medium hidden sm:block",
											(isCompleted || isCurrent) && "text-foreground",
											!isCompleted && !isCurrent && "text-muted-foreground",
										)}
									>
										{step.label}
									</p>
									<p
										className={cn(
											"text-[10px] font-medium sm:hidden",
											(isCompleted || isCurrent) && "text-foreground",
											!isCompleted && !isCurrent && "text-muted-foreground",
										)}
									>
										{step.shortLabel}
									</p>
								</div>
							</div>

							{/* Connector line */}
							{!isLast && (
								<div
									className={cn(
										"flex-1 h-0.5 mx-1 sm:mx-2 -mt-4 sm:-mt-6",
										isCompleted ? "bg-green-500" : "bg-muted-foreground/30",
									)}
								/>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

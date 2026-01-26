"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface WizardStep {
	id: number;
	title: string;
	description?: string;
}

interface WizardStepperProps {
	steps: WizardStep[];
	currentStep: number;
	className?: string;
}

export function WizardStepper({
	steps,
	currentStep,
	className,
}: WizardStepperProps) {
	return (
		<div className={cn("w-full", className)}>
			<div className="flex items-center justify-between">
				{steps.map((step, index) => {
					const isCompleted = currentStep > step.id;
					const isCurrent = currentStep === step.id;
					const isLast = index === steps.length - 1;

					return (
						<div key={step.id} className="flex items-center flex-1">
							{/* Step circle and content */}
							<div className="flex flex-col items-center">
								<div
									className={cn(
										"flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
										isCompleted &&
											"border-primary bg-primary text-primary-foreground",
										isCurrent && "border-primary bg-primary/10 text-primary",
										!isCompleted &&
											!isCurrent &&
											"border-muted-foreground/30 text-muted-foreground",
									)}
								>
									{isCompleted ? (
										<Check className="h-5 w-5" />
									) : (
										<span className="text-sm font-semibold">{step.id}</span>
									)}
								</div>
								<div className="mt-2 text-center">
									<p
										className={cn(
											"text-sm font-medium",
											(isCompleted || isCurrent) && "text-foreground",
											!isCompleted && !isCurrent && "text-muted-foreground",
										)}
									>
										{step.title}
									</p>
									{step.description && (
										<p className="text-xs text-muted-foreground mt-0.5">
											{step.description}
										</p>
									)}
								</div>
							</div>

							{/* Connector line */}
							{!isLast && (
								<div
									className={cn(
										"flex-1 h-0.5 mx-4 mt-[-1.5rem]",
										isCompleted ? "bg-primary" : "bg-muted-foreground/30",
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

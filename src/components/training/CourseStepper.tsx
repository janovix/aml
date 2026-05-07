"use client";

import { Check } from "lucide-react";
import { Fragment, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export interface CourseStepperStep {
	id: string;
	label: string;
	/** Module finished (persistent progress) */
	completed: boolean;
	/** User is viewing this step */
	selected: boolean;
	locked: boolean;
	statusHint: string;
	stepNumber: number;
}

export interface CourseStepperProps {
	steps: CourseStepperStep[];
	currentId: string;
	onSelect: (id: string) => void;
	progressLabel: string;
}

export function CourseStepper({
	steps,
	currentId,
	onSelect,
	progressLabel,
}: CourseStepperProps) {
	const itemRefs = useRef<Map<string, HTMLLIElement | null>>(new Map());

	useEffect(() => {
		const el = itemRefs.current.get(currentId);
		el?.scrollIntoView({
			inline: "center",
			block: "nearest",
			behavior: "smooth",
		});
	}, [currentId]);

	return (
		<div className="min-h-[88px] w-full pb-1">
			<p className="text-muted-foreground mb-2 text-xs tabular-nums">
				{progressLabel}
			</p>
			<ul
				role="list"
				className="flex min-h-[72px] items-start overflow-x-auto pb-1 snap-x snap-mandatory"
			>
				{steps.map((step, index) => (
					<Fragment key={step.id}>
						{index > 0 ? (
							<div
								className="mt-5 h-0.5 w-3 shrink-0 bg-muted sm:w-4"
								aria-hidden
							/>
						) : null}
						<li
							ref={(node) => {
								itemRefs.current.set(step.id, node);
							}}
							aria-current={step.id === currentId ? "step" : undefined}
							className="snap-start shrink-0"
						>
							<div className="flex w-[72px] flex-col items-center gap-1 sm:w-[96px]">
								<button
									type="button"
									disabled={step.locked}
									onClick={() => {
										if (!step.locked) {
											onSelect(step.id);
										}
									}}
									title={step.statusHint}
									className={cn(
										"relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
										step.locked &&
											"cursor-not-allowed border-muted bg-muted/40 text-muted-foreground opacity-60",
										!step.locked &&
											step.selected &&
											"ring-2 ring-primary ring-offset-2 ring-offset-background",
										!step.locked &&
											step.completed &&
											"border-primary bg-primary text-primary-foreground",
										!step.locked &&
											!step.completed &&
											"border-muted-foreground/40 bg-background text-muted-foreground hover:border-primary/50",
									)}
								>
									{step.completed ? (
										<Check className="h-5 w-5" aria-hidden strokeWidth={2.5} />
									) : (
										<span className="tabular-nums">{step.stepNumber}</span>
									)}
								</button>
								<span
									className={cn(
										"line-clamp-2 w-full px-0.5 text-center text-[11px] leading-tight text-muted-foreground sm:text-xs",
										step.locked && "opacity-60",
										step.selected && "font-medium text-foreground",
									)}
								>
									{step.label}
								</span>
							</div>
						</li>
					</Fragment>
				))}
			</ul>
		</div>
	);
}

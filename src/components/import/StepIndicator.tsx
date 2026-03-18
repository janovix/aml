"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
	{ id: 1, label: "Subir archivo" },
	{ id: 2, label: "Mapear columnas" },
	{ id: 3, label: "Procesando" },
] as const;

export function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
	return (
		<nav
			aria-label="Pasos de importación"
			className="mb-8 flex items-center gap-0"
		>
			<ol className="flex list-none items-center gap-0 p-0 m-0">
				{STEPS.map((step, idx) => {
					const done = step.id < current;
					const active = step.id === current;
					const statusText = done
						? "completado"
						: active
							? "paso actual"
							: "pendiente";
					return (
						<li
							key={step.id}
							className="flex items-center"
							{...(active && { "aria-current": "step" })}
						>
							<div className="flex items-center gap-2">
								<div
									className={cn(
										"flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
										done && "border-primary bg-primary text-primary-foreground",
										active &&
											"border-primary bg-primary text-primary-foreground",
										!done &&
											!active &&
											"border-border bg-background text-muted-foreground",
									)}
								>
									{done ? <Check className="h-3.5 w-3.5" /> : step.id}
								</div>
								<span
									className={cn(
										"text-sm font-medium",
										active ? "text-foreground" : "text-muted-foreground",
									)}
								>
									{step.label}
								</span>
								<span className="sr-only">{statusText}</span>
							</div>
							{idx < STEPS.length - 1 && (
								<div
									className={cn(
										"mx-3 h-px w-16",
										done ? "bg-primary" : "bg-border",
									)}
									aria-hidden
								/>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}

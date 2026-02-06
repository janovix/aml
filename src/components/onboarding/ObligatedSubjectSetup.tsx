"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, Building2, Loader2, Check } from "lucide-react";
import { getAllActivityVisuals } from "@/lib/activity-registry";
import type { ActivityCode } from "@/types/operation";
import { ENABLED_ACTIVITY_CODES } from "@/types/operation";
import { updateOrganizationSettings } from "@/lib/api/organization-settings";
import { useJwt } from "@/hooks/useJwt";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ObligatedSubjectSetupProps {
	onComplete: () => void;
	onSwitchOrg: () => void;
}

const RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

const enabledSet = new Set<string>(ENABLED_ACTIVITY_CODES);

export function ObligatedSubjectSetup({
	onComplete,
	onSwitchOrg,
}: ObligatedSubjectSetupProps) {
	const { jwt } = useJwt();
	const [selectedActivity, setSelectedActivity] = useState<ActivityCode | null>(
		null,
	);
	const [rfc, setRfc] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const activities = getAllActivityVisuals();

	const trimmedRfc = rfc.trim().toUpperCase();
	const isRfcValid = RFC_PATTERN.test(trimmedRfc);
	const personType =
		trimmedRfc.length === 13
			? "Persona Física"
			: trimmedRfc.length === 12
				? "Persona Moral"
				: null;

	const canSubmit = selectedActivity && isRfcValid && !isSubmitting && !!jwt;

	async function handleSubmit() {
		if (!selectedActivity || !isRfcValid || !jwt) return;

		setIsSubmitting(true);
		try {
			await updateOrganizationSettings({
				input: {
					obligatedSubjectKey: trimmedRfc,
					activityKey: selectedActivity,
				},
				jwt,
			});
			toast.success("Configuración guardada correctamente");
			onComplete();
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: "Error al guardar la configuración",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="min-h-screen bg-linear-to-br from-background via-muted/50 to-background flex items-start sm:items-center justify-center px-0 py-3 sm:p-4 overflow-y-auto">
			<Card className="w-full max-w-3xl shadow-lg rounded-none border-x-0 sm:rounded-xl sm:border-x">
				<CardHeader className="text-center space-y-2 sm:space-y-3 px-4 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-4">
					<div className="mx-auto flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10">
						<Building2 className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
					</div>
					<CardTitle className="text-xl sm:text-2xl">
						Configuración de Sujeto Obligado
					</CardTitle>
					<CardDescription className="text-sm sm:text-base">
						Antes de registrar operaciones, debes configurar la actividad
						vulnerable y el RFC del sujeto obligado.
					</CardDescription>
					<div className="flex items-center justify-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-amber-700 dark:text-amber-300">
						<AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
						<span>Esta selección es permanente y no se puede cambiar.</span>
					</div>
				</CardHeader>

				<CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
					{/* Activity selector */}
					<div className="space-y-3">
						<Label className="text-base font-semibold">
							Actividad Vulnerable
						</Label>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
							{activities.map((activity) => {
								const Icon = activity.icon;
								const isEnabled = enabledSet.has(activity.code);
								const isSelected = selectedActivity === activity.code;

								const button = (
									<button
										key={activity.code}
										type="button"
										disabled={!isEnabled}
										onClick={() => setSelectedActivity(activity.code)}
										className={cn(
											"relative flex items-start gap-2.5 sm:gap-3 rounded-lg border p-2.5 sm:p-3 text-left transition-all",
											"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
											isEnabled
												? "cursor-pointer hover:bg-accent/50"
												: "cursor-not-allowed opacity-50",
											isSelected
												? cn(
														activity.color.borderSelected,
														activity.color.backgroundSelected,
														"ring-2",
														activity.color.ring,
													)
												: cn(activity.color.border, activity.color.background),
										)}
									>
										{isSelected && (
											<div
												className={cn(
													"absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white",
													activity.color.checkBg,
												)}
											>
												<Check className="h-3 w-3" />
											</div>
										)}
										<div className="shrink-0 mt-0.5">
											<Icon
												className={cn(
													"h-5 w-5",
													isSelected
														? activity.color.iconSelected
														: activity.color.icon,
												)}
											/>
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-baseline gap-1.5">
												<span
													className={cn(
														"text-xs font-bold",
														isSelected
															? activity.color.iconSelected
															: "text-muted-foreground",
													)}
												>
													{activity.code}
												</span>
												<span className="text-[10px] text-muted-foreground">
													Fracc. {activity.lfpiropiFraccion}
												</span>
											</div>
											<p className="text-xs leading-tight mt-0.5 text-foreground/80">
												{activity.label}
											</p>
										</div>
									</button>
								);

								if (!isEnabled && activity.disabledReason) {
									return (
										<Tooltip key={activity.code}>
											<TooltipTrigger asChild>{button}</TooltipTrigger>
											<TooltipContent side="top">
												{activity.disabledReason}
											</TooltipContent>
										</Tooltip>
									);
								}

								return button;
							})}
						</div>
					</div>

					{/* RFC input */}
					<div className="space-y-2">
						<Label htmlFor="rfc-input" className="text-base font-semibold">
							RFC del Sujeto Obligado
						</Label>
						<Input
							id="rfc-input"
							placeholder="Ej. XAXX010101000"
							maxLength={13}
							value={rfc}
							onChange={(e) => setRfc(e.target.value.toUpperCase())}
							className={cn(
								"font-mono text-base tracking-wider",
								trimmedRfc.length > 0 &&
									!isRfcValid &&
									"border-destructive focus-visible:ring-destructive/20",
							)}
						/>
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">
								{trimmedRfc.length > 0
									? `${trimmedRfc.length}/13 caracteres`
									: "12 caracteres (moral) o 13 caracteres (física)"}
							</span>
							{personType && isRfcValid && (
								<span className="font-medium text-emerald-600 dark:text-emerald-400">
									{personType}
								</span>
							)}
							{trimmedRfc.length > 0 && !isRfcValid && (
								<span className="text-destructive">
									Formato de RFC inválido
								</span>
							)}
						</div>
					</div>

					{/* Submit */}
					<div className="flex flex-col gap-2 sm:gap-3 pt-1 sm:pt-2 pb-1 sm:pb-0">
						<Button
							size="lg"
							className="w-full"
							disabled={!canSubmit}
							onClick={handleSubmit}
						>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Guardar configuración
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="text-muted-foreground"
							onClick={onSwitchOrg}
						>
							Cambiar organización
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Building2,
	RefreshCw,
	AlertTriangle,
	Play,
	History,
	Shield,
	ShieldCheck,
} from "lucide-react";
import { PageHero } from "@/components/page-hero/page-hero";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageProvider";
import { useJwt } from "@/hooks/useJwt";
import { useOrgStore } from "@/lib/org-store";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { cn } from "@/lib/utils";
import {
	getOrgRiskAssessment,
	getOrgRiskEvolution,
	triggerOrgRiskAssessment,
	type OrgRiskAssessment,
	type OrgEvolutionPoint,
} from "@/lib/api/risk";
import { RiskBadge } from "./RiskBadge";
import { RiskScoreGauge } from "./RiskScoreGauge";
import { RiskFactorBreakdown } from "./RiskFactorBreakdown";
import { OrgMitigantsList } from "./OrgMitigantsList";

export function OrgAssessmentView() {
	const { language } = useLanguage();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { currentOrg } = useOrgStore();
	const { orgPath } = useOrgNavigation();

	const [assessment, setAssessment] = useState<OrgRiskAssessment | null>(null);
	const [evolution, setEvolution] = useState<OrgEvolutionPoint[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isTriggering, setIsTriggering] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(
		async (jwtToken: string) => {
			setIsLoading(true);
			setError(null);
			try {
				const [a, ev] = await Promise.all([
					getOrgRiskAssessment({ jwt: jwtToken }).catch(() => null),
					getOrgRiskEvolution({ jwt: jwtToken }).catch(
						() => [] as OrgEvolutionPoint[],
					),
				]);
				setAssessment(a);
				setEvolution(ev);
			} catch {
				setError(
					language === "es"
						? "Error al cargar la evaluación"
						: "Error loading assessment",
				);
			} finally {
				setIsLoading(false);
			}
		},
		[language],
	);

	useEffect(() => {
		if (isJwtLoading || !jwt || !currentOrg?.id) {
			if (!isJwtLoading) setIsLoading(false);
			return;
		}
		fetchData(jwt);
	}, [isJwtLoading, jwt, currentOrg?.id, fetchData]);

	const handleTrigger = async () => {
		if (!jwt) return;
		setIsTriggering(true);
		try {
			await triggerOrgRiskAssessment({ jwt });
			toast.success(
				language === "es"
					? "Evaluación organizacional encolada. Los resultados estarán disponibles en breve."
					: "Organization assessment queued. Results will be available shortly.",
			);
			setTimeout(() => jwt && fetchData(jwt), 3000);
		} catch {
			toast.error(
				language === "es"
					? "Error al iniciar la evaluación"
					: "Error triggering assessment",
			);
		} finally {
			setIsTriggering(false);
		}
	};

	return (
		<div className="space-y-6">
			<PageHero
				title={
					language === "es"
						? "Evaluación Organizacional EBR"
						: "Organization EBR Assessment"
				}
				subtitle={
					language === "es"
						? "Evaluación con Enfoque Basado en Riesgo conforme al Art. 18-VII de la LFPIORPI"
						: "Risk-Based Approach assessment per Art. 18-VII LFPIORPI"
				}
				icon={Building2}
				backButton={{
					label: language === "es" ? "Modelos de Riesgo" : "Risk Models",
					onClick: () => {
						window.location.href = orgPath("/risk");
					},
				}}
				actions={[
					{
						label: language === "es" ? "Actualizar" : "Refresh",
						icon: RefreshCw,
						onClick: () => jwt && fetchData(jwt),
						variant: "outline",
						disabled: isLoading,
					},
				]}
			/>

			{isLoading && !assessment && (
				<div className="space-y-6">
					<Skeleton className="h-[200px] rounded-xl" />
					<Skeleton className="h-[300px] rounded-xl" />
				</div>
			)}

			{error && !isLoading && (
				<Card className="border-destructive/50 bg-destructive/5">
					<CardContent className="pt-6">
						<div className="flex items-center gap-2 text-destructive">
							<AlertTriangle className="h-5 w-5" />
							<span>{error}</span>
						</div>
					</CardContent>
				</Card>
			)}

			{!isLoading && !assessment && !error && (
				<Card>
					<CardContent className="pt-6">
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<Building2 className="h-12 w-12 text-muted-foreground/50" />
							<h3 className="mt-4 text-lg font-semibold">
								{language === "es"
									? "Sin evaluación organizacional"
									: "No organization assessment"}
							</h3>
							<p className="mt-2 text-sm text-muted-foreground max-w-md">
								{language === "es"
									? "Inicie una evaluación EBR para analizar el perfil de riesgo de su organización conforme al Art. 18-VII."
									: "Start an EBR assessment to analyze your organization's risk profile per Art. 18-VII."}
							</p>
							<Button
								className="mt-6"
								onClick={handleTrigger}
								disabled={isTriggering}
							>
								<Play className="mr-2 h-4 w-4" />
								{language === "es" ? "Iniciar evaluación" : "Start assessment"}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{assessment && (
				<div
					className={cn(
						"space-y-6 transition-opacity duration-200",
						isLoading && "opacity-60 pointer-events-none",
					)}
				>
					{/* Summary header */}
					<Card>
						<CardContent className="pt-6">
							<div className="flex flex-col @lg/main:flex-row items-center gap-6">
								<div className="flex items-center gap-6">
									<RiskScoreGauge
										score={assessment.inherentRiskScore}
										level={assessment.riskLevel}
										label={
											language === "es" ? "Riesgo inherente" : "Inherent risk"
										}
										size="lg"
									/>
									<RiskScoreGauge
										score={assessment.residualRiskScore}
										level={assessment.riskLevel}
										label={
											language === "es" ? "Riesgo residual" : "Residual risk"
										}
										size="lg"
									/>
								</div>
								<div className="flex-1 grid grid-cols-2 @lg/main:grid-cols-4 gap-4">
									<div className="rounded-lg border bg-muted/50 p-3 text-center">
										<div className="text-xs text-muted-foreground">
											{language === "es" ? "Nivel de riesgo" : "Risk level"}
										</div>
										<div className="mt-1">
											<RiskBadge
												level={assessment.riskLevel}
												language={language}
												size="md"
											/>
										</div>
									</div>
									<div className="rounded-lg border bg-muted/50 p-3 text-center">
										<div className="text-xs text-muted-foreground">
											{language === "es" ? "Auditoría" : "Audit"}
										</div>
										<div className="mt-1 text-sm font-medium">
											{assessment.requiredAuditType}
										</div>
									</div>
									<div className="rounded-lg border bg-muted/50 p-3 text-center">
										<div className="text-xs text-muted-foreground">
											{language === "es" ? "Riesgo FP" : "FP risk"}
										</div>
										<div className="mt-1 text-sm font-medium">
											{assessment.fpRiskLevel}
										</div>
									</div>
									<div className="rounded-lg border bg-muted/50 p-3 text-center">
										<div className="text-xs text-muted-foreground">
											{language === "es" ? "Versión" : "Version"}
										</div>
										<div className="mt-1 text-sm font-medium tabular-nums">
											v{assessment.version}
										</div>
									</div>
								</div>
							</div>
							<div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
								<span>
									{language === "es" ? "Período" : "Period"}:{" "}
									{new Date(assessment.periodStartDate).toLocaleDateString(
										language === "es" ? "es-MX" : "en-US",
										{
											year: "numeric",
											month: "short",
											day: "numeric",
										},
									)}{" "}
									—{" "}
									{new Date(assessment.periodEndDate).toLocaleDateString(
										language === "es" ? "es-MX" : "en-US",
										{
											year: "numeric",
											month: "short",
											day: "numeric",
										},
									)}
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={handleTrigger}
									disabled={isTriggering}
								>
									<RefreshCw
										className={cn(
											"mr-2 h-3.5 w-3.5",
											isTriggering && "animate-spin",
										)}
									/>
									{language === "es" ? "Re-evaluar" : "Re-assess"}
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Elements Breakdown + Mitigants */}
					<div className="grid gap-6 @2xl/main:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Shield className="h-5 w-5 text-primary" />
									{language === "es" ? "Elementos de Riesgo" : "Risk Elements"}
								</CardTitle>
								<CardDescription>
									{language === "es"
										? "Desglose por los 4 elementos GAFI"
										: "Breakdown by 4 FATF elements"}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<RiskFactorBreakdown
									elements={assessment.elements.map((e) => ({
										elementType: e.elementType,
										factors: Object.entries(e.factorBreakdown).map(
											([name, score]) => ({
												name,
												score: score as number,
												weight: 1,
												weightedScore: score as number,
											}),
										),
										rawScore: e.riskScore,
										riskLevel: e.riskLevel,
									}))}
									language={language}
								/>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ShieldCheck className="h-5 w-5 text-primary" />
									{language === "es"
										? "Controles Mitigantes"
										: "Mitigating Controls"}
								</CardTitle>
								<CardDescription>
									{language === "es"
										? "Estado de controles y su efecto en el riesgo residual"
										: "Control status and their effect on residual risk"}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<OrgMitigantsList
									mitigants={assessment.mitigants}
									language={language}
								/>
							</CardContent>
						</Card>
					</div>

					{/* Evolution History */}
					{evolution.length > 1 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<History className="h-5 w-5 text-primary" />
									{language === "es"
										? "Historial de Evolución"
										: "Evolution History"}
								</CardTitle>
								<CardDescription>
									{language === "es"
										? "Tendencia de riesgo a través de las evaluaciones"
										: "Risk trend across assessments"}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b">
												<th className="text-left py-2 font-medium text-muted-foreground">
													{language === "es" ? "Versión" : "Version"}
												</th>
												<th className="text-left py-2 font-medium text-muted-foreground">
													{language === "es" ? "Fecha" : "Date"}
												</th>
												<th className="text-left py-2 font-medium text-muted-foreground">
													{language === "es" ? "Nivel" : "Level"}
												</th>
												<th className="text-right py-2 font-medium text-muted-foreground">
													{language === "es" ? "Inherente" : "Inherent"}
												</th>
												<th className="text-right py-2 font-medium text-muted-foreground">
													{language === "es" ? "Residual" : "Residual"}
												</th>
												<th className="text-left py-2 font-medium text-muted-foreground">
													{language === "es" ? "Auditoría" : "Audit"}
												</th>
											</tr>
										</thead>
										<tbody>
											{evolution.map((ev) => (
												<tr key={ev.version} className="border-b last:border-0">
													<td className="py-2 tabular-nums">v{ev.version}</td>
													<td className="py-2 text-muted-foreground">
														{new Date(ev.date).toLocaleDateString(
															language === "es" ? "es-MX" : "en-US",
															{
																year: "numeric",
																month: "short",
																day: "numeric",
															},
														)}
													</td>
													<td className="py-2">
														<RiskBadge
															level={ev.riskLevel}
															language={language}
														/>
													</td>
													<td className="py-2 text-right tabular-nums">
														{ev.inherentRiskScore.toFixed(1)}
													</td>
													<td className="py-2 text-right tabular-nums">
														{ev.residualRiskScore.toFixed(1)}
													</td>
													<td className="py-2">{ev.requiredAuditType}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			)}
		</div>
	);
}

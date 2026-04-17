"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
	Shield,
	RefreshCw,
	AlertTriangle,
	Users,
	Building2,
	CalendarClock,
	ArrowRight,
	ClipboardList,
	Settings2,
	Play,
	Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHero, type StatCard } from "@/components/page-hero/page-hero";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageProvider";
import { useJwt } from "@/hooks/useJwt";
import { useOrgStore } from "@/lib/org-store";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { cn } from "@/lib/utils";
import {
	getRiskDashboard,
	getOrgRiskAssessment,
	triggerOrgRiskAssessment,
	type ClientRiskDashboard,
	type OrgRiskAssessment,
} from "@/lib/api/risk";
import { RiskBadge } from "./RiskBadge";
import { RiskScoreGauge } from "./RiskScoreGauge";
import { RiskDistributionChart } from "./RiskDistributionChart";
import { RiskFactorBreakdown } from "./RiskFactorBreakdown";

interface DashboardData {
	clientDashboard: ClientRiskDashboard | null;
	orgAssessment: OrgRiskAssessment | null;
}

type OrgAssessmentPollState = "idle" | "queuing" | "running" | "error";

function formatAssessmentDate(iso: string, language: "es" | "en"): string {
	return new Date(iso).toLocaleDateString(
		language === "es" ? "es-MX" : "en-US",
		{ year: "numeric", month: "short", day: "numeric" },
	);
}

export function RiskDashboardView() {
	const { t, language } = useLanguage();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { currentOrg } = useOrgStore();
	const { orgPath } = useOrgNavigation();

	const [data, setData] = useState<DashboardData>({
		clientDashboard: null,
		orgAssessment: null,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [orgPollState, setOrgPollState] =
		useState<OrgAssessmentPollState>("idle");
	const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const pollDeadlineRef = useRef<number>(0);

	const clearOrgPoll = useCallback(() => {
		if (pollIntervalRef.current !== null) {
			clearInterval(pollIntervalRef.current);
			pollIntervalRef.current = null;
		}
	}, []);

	const fetchData = useCallback(
		async (jwtToken: string) => {
			setIsLoading(true);
			setError(null);
			try {
				const orgId = currentOrg?.id;
				const [clientDashboard, orgAssessment] = await Promise.all([
					getRiskDashboard({
						jwt: jwtToken,
						...(orgId ? { organizationId: orgId } : {}),
					}).catch(() => null),
					getOrgRiskAssessment({ jwt: jwtToken }).catch(() => null),
				]);
				setData({ clientDashboard, orgAssessment });
			} catch {
				setError(
					language === "es"
						? "Error al cargar datos de riesgo"
						: "Error loading risk data",
				);
			} finally {
				setIsLoading(false);
			}
		},
		[language, currentOrg?.id],
	);

	useEffect(() => {
		if (isJwtLoading || !jwt || !currentOrg?.id) {
			if (!isJwtLoading) setIsLoading(false);
			return;
		}
		fetchData(jwt);
	}, [isJwtLoading, jwt, currentOrg?.id, fetchData]);

	useEffect(() => {
		return () => {
			clearOrgPoll();
		};
	}, [clearOrgPoll]);

	useEffect(() => {
		if (data.orgAssessment) {
			clearOrgPoll();
			setOrgPollState("idle");
		}
	}, [data.orgAssessment, clearOrgPoll]);

	const handleStartOrgAssessment = useCallback(async () => {
		if (!jwt) return;
		setOrgPollState("queuing");
		try {
			await triggerOrgRiskAssessment({ jwt });
			toast.success(
				language === "es"
					? "Evaluación organizacional encolada. Los resultados estarán disponibles en breve."
					: "Organization assessment queued. Results will be available shortly.",
			);
			setOrgPollState("running");
			pollDeadlineRef.current = Date.now() + 90_000;

			const tick = async () => {
				if (Date.now() > pollDeadlineRef.current) {
					clearOrgPoll();
					setOrgPollState("error");
					toast.error(
						language === "es"
							? "La evaluación tardó más de lo esperado. Abra la página de detalle o reintente."
							: "The assessment is taking longer than expected. Open the detail page or try again.",
					);
					return;
				}
				try {
					const next = await getOrgRiskAssessment({ jwt });
					if (next) {
						clearOrgPoll();
						setOrgPollState("idle");
						await fetchData(jwt);
						toast.success(
							language === "es"
								? "Evaluación organizacional lista."
								: "Organization assessment is ready.",
						);
					}
				} catch {
					// keep polling until deadline
				}
			};

			clearOrgPoll();
			void tick();
			pollIntervalRef.current = setInterval(() => {
				void tick();
			}, 5000);
		} catch {
			setOrgPollState("error");
			toast.error(
				language === "es"
					? "Error al iniciar la evaluación"
					: "Error triggering assessment",
			);
		}
	}, [jwt, language, fetchData, clearOrgPoll]);

	const dist = data.clientDashboard?.distribution;
	const stats: StatCard[] = [];
	if (data.clientDashboard && dist) {
		stats.push({
			label: language === "es" ? "Clientes evaluados" : "Clients assessed",
			value: dist.total,
			icon: Users,
			variant: "primary",
		});
		stats.push({
			label: language === "es" ? "Alto riesgo" : "High risk",
			value: dist.HIGH,
			icon: AlertTriangle,
		});
		stats.push({
			label: language === "es" ? "Pendientes de revisión" : "Due for review",
			value: data.clientDashboard.dueForReview,
			icon: CalendarClock,
		});
	}

	const hasData = (data.clientDashboard && dist) || data.orgAssessment;
	const showSkeleton = isLoading && !hasData;

	return (
		<div className="space-y-6">
			<PageHero
				title={language === "es" ? "Modelos de Riesgo" : "Risk Models"}
				subtitle={
					language === "es"
						? "Evaluación con Enfoque Basado en Riesgo (EBR) conforme al Art. 18 LFPIORPI"
						: "Risk-Based Approach (RBA) assessment per Art. 18 LFPIORPI"
				}
				icon={Shield}
				stats={stats.length > 0 ? stats : undefined}
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

			{showSkeleton && (
				<div className="space-y-6">
					<Skeleton className="h-[200px] rounded-xl" />
					<div className="grid gap-6 @2xl/main:grid-cols-2">
						<Skeleton className="h-[300px] rounded-xl" />
						<Skeleton className="h-[300px] rounded-xl" />
					</div>
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

			{hasData && (
				<div
					className={cn(
						"space-y-6 transition-opacity duration-200",
						isLoading && "opacity-60 pointer-events-none",
					)}
				>
					{/* Org Assessment Summary + Client Distribution */}
					<div className="grid gap-6 @2xl/main:grid-cols-2">
						{/* Org Assessment Card */}
						<Card className="h-full">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="flex items-center gap-2">
											<Building2 className="h-5 w-5 text-primary" />
											{language === "es"
												? "Evaluación Organizacional"
												: "Organization Assessment"}
										</CardTitle>
										<CardDescription>
											{language === "es"
												? "EBR Art. 18-VII LFPIORPI"
												: "RBA Art. 18-VII LFPIORPI"}
										</CardDescription>
									</div>
									{data.orgAssessment && (
										<RiskBadge
											level={data.orgAssessment.riskLevel}
											language={language}
											size="md"
										/>
									)}
								</div>
							</CardHeader>
							<CardContent>
								{data.orgAssessment ? (
									<div className="space-y-4">
										<div className="space-y-2 rounded-lg border bg-muted/50 p-3 text-sm">
											<div className="flex items-center justify-between gap-2">
												<span className="text-muted-foreground">
													{t("riskDashboardLastRun")}
												</span>
												<span className="font-medium tabular-nums">
													{formatAssessmentDate(
														data.orgAssessment.createdAt,
														language,
													)}
												</span>
											</div>
											<div className="flex items-center justify-between gap-2">
												<span className="text-muted-foreground">
													{t("riskDashboardAssessmentPeriod")}
												</span>
												<span className="font-medium text-right">
													{formatAssessmentDate(
														data.orgAssessment.periodStartDate,
														language,
													)}{" "}
													—{" "}
													{formatAssessmentDate(
														data.orgAssessment.periodEndDate,
														language,
													)}
												</span>
											</div>
										</div>

										<div className="flex items-center justify-around">
											<RiskScoreGauge
												score={data.orgAssessment.inherentRiskScore}
												level={data.orgAssessment.riskLevel}
												label={
													language === "es"
														? "Riesgo inherente"
														: "Inherent risk"
												}
											/>
											<RiskScoreGauge
												score={data.orgAssessment.residualRiskScore}
												level={data.orgAssessment.riskLevel}
												label={
													language === "es"
														? "Riesgo residual"
														: "Residual risk"
												}
											/>
										</div>

										<div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
											<span className="text-sm text-muted-foreground">
												{language === "es"
													? "Tipo de auditoría requerida"
													: "Required audit type"}
											</span>
											<span className="text-sm font-medium">
												{data.orgAssessment.requiredAuditType}
											</span>
										</div>

										<div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
											<span className="text-sm text-muted-foreground">
												{language === "es" ? "Versión" : "Version"}
											</span>
											<span className="text-sm font-medium tabular-nums">
												v{data.orgAssessment.version}
											</span>
										</div>

										<Link href={orgPath("/risk/assessment")}>
											<Button
												variant="outline"
												className="w-full mt-2"
												size="sm"
											>
												{language === "es"
													? "Ver detalle completo"
													: "View full details"}
												<ArrowRight className="ml-2 h-4 w-4" />
											</Button>
										</Link>
									</div>
								) : (
									<div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
										<Building2 className="h-10 w-10 text-muted-foreground/50" />
										<p className="text-sm text-muted-foreground max-w-md">
											{language === "es"
												? "No se ha realizado una evaluación organizacional"
												: "No organization assessment has been performed"}
										</p>
										{orgPollState === "running" && (
											<p className="text-xs text-muted-foreground max-w-sm">
												{t("riskDashboardOrgPollRunning")}
											</p>
										)}
										{orgPollState === "error" && (
											<p className="text-xs text-destructive max-w-sm">
												{t("riskDashboardOrgPollTimeout")}
											</p>
										)}
										<div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-sm">
											<Button
												className="w-full sm:flex-1"
												onClick={() => void handleStartOrgAssessment()}
												disabled={
													orgPollState === "queuing" ||
													orgPollState === "running"
												}
											>
												{orgPollState === "queuing" ||
												orgPollState === "running" ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<Play className="mr-2 h-4 w-4" />
												)}
												{language === "es"
													? "Iniciar evaluación"
													: "Start assessment"}
											</Button>
											<Button
												variant="outline"
												className="w-full sm:flex-1"
												asChild
											>
												<Link href={orgPath("/risk/assessment")}>
													{language === "es"
														? "Abrir detalle"
														: "Open detail page"}
													<ArrowRight className="ml-2 h-4 w-4" />
												</Link>
											</Button>
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Client Risk Distribution */}
						<Card className="h-full">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="h-5 w-5 text-primary" />
									{language === "es"
										? "Distribución de Riesgo"
										: "Risk Distribution"}
								</CardTitle>
								<CardDescription>
									{language === "es"
										? "Clasificación de clientes por nivel de riesgo"
										: "Client classification by risk level"}
								</CardDescription>
							</CardHeader>
							<CardContent>
								{data.clientDashboard && dist ? (
									<RiskDistributionChart
										distribution={dist}
										total={dist.total}
										language={language}
									/>
								) : (
									<div className="flex flex-col items-center justify-center py-8 text-center">
										<Users className="h-10 w-10 text-muted-foreground/50" />
										<p className="mt-2 text-sm text-muted-foreground">
											{language === "es"
												? "Sin datos de distribución"
												: "No distribution data"}
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Quick Actions */}
					<div className="grid gap-4 @2xl/main:grid-cols-2 @3xl/main:grid-cols-3">
						<Link href={orgPath("/risk/assessment")}>
							<Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
								<CardContent className="flex items-center gap-4 py-5">
									<div className="rounded-lg bg-primary/10 p-3">
										<Building2 className="h-5 w-5 text-primary" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-medium">
											{t("riskDashboardViewOrgAssessment")}
										</p>
										<p className="text-sm text-muted-foreground">
											{t("riskDashboardViewOrgAssessmentDesc")}
										</p>
									</div>
									<ArrowRight className="h-4 w-4 text-muted-foreground" />
								</CardContent>
							</Card>
						</Link>
						<Link href={orgPath("/risk/evaluations")}>
							<Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
								<CardContent className="flex items-center gap-4 py-5">
									<div className="rounded-lg bg-primary/10 p-3">
										<ClipboardList className="h-5 w-5 text-primary" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-medium">
											{t("riskDashboardViewEvaluations")}
										</p>
										<p className="text-sm text-muted-foreground">
											{t("riskDashboardViewEvaluationsDesc")}
										</p>
									</div>
									<ArrowRight className="h-4 w-4 text-muted-foreground" />
								</CardContent>
							</Card>
						</Link>
						<Link href={orgPath("/risk/methodology")}>
							<Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
								<CardContent className="flex items-center gap-4 py-5">
									<div className="rounded-lg bg-primary/10 p-3">
										<Settings2 className="h-5 w-5 text-primary" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-medium">
											{t("riskDashboardMethodology")}
										</p>
										<p className="text-sm text-muted-foreground">
											{t("riskDashboardMethodologyDesc")}
										</p>
									</div>
									<ArrowRight className="h-4 w-4 text-muted-foreground" />
								</CardContent>
							</Card>
						</Link>
					</div>

					{/* Element Breakdown (from org assessment) */}
					{data.orgAssessment && data.orgAssessment.elements.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Shield className="h-5 w-5 text-primary" />
									{language === "es"
										? "Desglose por Elementos de Riesgo"
										: "Risk Elements Breakdown"}
								</CardTitle>
								<CardDescription>
									{language === "es"
										? "Evaluación por factores conforme a GAFI R.1"
										: "Assessment by factors per FATF R.1"}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<RiskFactorBreakdown
									elements={data.orgAssessment.elements.map((e) => ({
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
					)}
				</div>
			)}
		</div>
	);
}

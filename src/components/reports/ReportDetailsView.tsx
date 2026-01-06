"use client";

import { useState, useEffect, useMemo } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useJwt } from "@/hooks/useJwt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	FileText,
	Calendar,
	ArrowLeft,
	Download,
	Clock,
	FileCheck2,
	Loader2,
	AlertTriangle,
	FileType,
	AlertCircle,
	TrendingUp,
	TrendingDown,
	Minus,
	BarChart3,
	PieChart as PieChartIcon,
	Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHero, type StatCard } from "@/components/page-hero";
import { PageHeroSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import {
	getReportById,
	generateReportFile,
	getReportDownloadUrl,
	type ReportWithAlertSummary,
	type ReportStatus,
} from "@/lib/api/reports";
import { toast } from "sonner";
import {
	DonutChart,
	BarChart,
	MetricCard,
	SEVERITY_COLORS,
	STATUS_COLORS,
} from "./ReportCharts";

interface ReportDetailsViewProps {
	reportId: string;
}

/**
 * Skeleton component for ReportDetailsView
 */
export function ReportDetailsSkeleton(): React.ReactElement {
	return (
		<div className="space-y-6">
			<PageHeroSkeleton
				showStats={false}
				showBackButton={true}
				actionCount={2}
			/>
			<div className="grid gap-6 md:grid-cols-2">
				{[1, 2].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-48" />
						</CardHeader>
						<CardContent className="space-y-4">
							{[1, 2, 3].map((j) => (
								<div key={j} className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-5 w-40" />
								</div>
							))}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

const statusConfig: Record<
	ReportStatus,
	{ label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
	DRAFT: {
		label: "Borrador",
		icon: <Clock className="h-4 w-4" />,
		color: "text-zinc-400",
		bgColor: "bg-zinc-500/20",
	},
	GENERATED: {
		label: "Generado",
		icon: <FileCheck2 className="h-4 w-4" />,
		color: "text-emerald-400",
		bgColor: "bg-emerald-500/20",
	},
};

const typeLabels: Record<string, string> = {
	MONTHLY: "Mensual",
	QUARTERLY: "Trimestral",
	ANNUAL: "Anual",
	CUSTOM: "Personalizado",
	EXECUTIVE_SUMMARY: "Resumen Ejecutivo",
	COMPLIANCE_STATUS: "Estado de Cumplimiento",
	TRANSACTION_ANALYSIS: "Análisis de Transacciones",
	CLIENT_RISK_PROFILE: "Perfil de Riesgo",
	ALERT_BREAKDOWN: "Desglose de Alertas",
	PERIOD_COMPARISON: "Comparación de Períodos",
};

export function ReportDetailsView({
	reportId,
}: ReportDetailsViewProps): React.ReactElement {
	const { navigateTo } = useOrgNavigation();
	const { jwt, isLoading: isJwtLoading } = useJwt();

	const [report, setReport] = useState<ReportWithAlertSummary | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isGenerating, setIsGenerating] = useState(false);

	// Fetch report data
	useEffect(() => {
		const fetchReport = async () => {
			if (!jwt || isJwtLoading) return;

			setIsLoading(true);
			try {
				const data = await getReportById({ id: reportId, jwt });
				setReport(data);
			} catch (error) {
				console.error("Error fetching report:", error);
				toast.error("Error al cargar el reporte");
			} finally {
				setIsLoading(false);
			}
		};

		fetchReport();
	}, [reportId, jwt, isJwtLoading]);

	const handleGenerate = async () => {
		if (!jwt || !report) return;

		setIsGenerating(true);
		try {
			await generateReportFile({ id: report.id, jwt });
			toast.success("Reporte generado exitosamente");
			const updated = await getReportById({ id: reportId, jwt });
			setReport(updated);
		} catch (error) {
			console.error("Error generating report:", error);
			toast.error("Error al generar el reporte");
		} finally {
			setIsGenerating(false);
		}
	};

	const handleDownload = async () => {
		if (!jwt || !report) return;

		try {
			const { fileUrl } = await getReportDownloadUrl({
				id: report.id,
				format: "pdf",
				jwt,
			});
			window.open(fileUrl, "_blank");
		} catch (error) {
			console.error("Error downloading report:", error);
			toast.error("Error al descargar el reporte");
		}
	};

	// Prepare chart data
	const severityChartData = useMemo(() => {
		if (!report) return [];
		return Object.entries(report.alertSummary.bySeverity).map(
			([severity, count]) => ({
				label: severity.charAt(0) + severity.slice(1).toLowerCase(),
				value: count,
				color: SEVERITY_COLORS[severity] || "#6b7280",
			}),
		);
	}, [report]);

	const statusChartData = useMemo(() => {
		if (!report) return [];
		return Object.entries(report.alertSummary.byStatus).map(
			([status, count]) => ({
				label: status.replace("_", " "),
				value: count,
				color: STATUS_COLORS[status] || "#6b7280",
			}),
		);
	}, [report]);

	const ruleChartData = useMemo(() => {
		if (!report) return [];
		return report.alertSummary.byRule.slice(0, 8).map((rule) => ({
			label: rule.ruleName.substring(0, 12),
			value: rule.count,
		}));
	}, [report]);

	// Calculate compliance score (simplified example)
	const complianceScore = useMemo(() => {
		if (!report) return 0;
		const total = report.alertSummary.total || 1;
		const critical = report.alertSummary.bySeverity.CRITICAL || 0;
		const high = report.alertSummary.bySeverity.HIGH || 0;
		// Simple formula: lower severity alerts = higher score
		const score = Math.max(0, 100 - (critical * 10 + high * 5));
		return Math.min(100, score);
	}, [report]);

	if (isLoading || isJwtLoading) {
		return <ReportDetailsSkeleton />;
	}

	if (!report) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-medium">Reporte no encontrado</h3>
				<p className="text-muted-foreground">
					El reporte solicitado no existe o no tienes acceso
				</p>
				<Button
					variant="outline"
					onClick={() => navigateTo("/reports")}
					className="mt-4"
				>
					Volver a Reportes
				</Button>
			</div>
		);
	}

	const status = statusConfig[report.status] || statusConfig.DRAFT;
	const criticalCount = report.alertSummary.bySeverity.CRITICAL || 0;
	const highCount = report.alertSummary.bySeverity.HIGH || 0;

	const stats: StatCard[] = [
		{
			label: "Total Alertas",
			value: report.alertSummary.total,
			icon: AlertTriangle,
		},
		{
			label: "Alta/Crítica",
			value: criticalCount + highCount,
			icon: AlertCircle,
			variant: criticalCount + highCount > 0 ? "primary" : undefined,
		},
		{
			label: "Reglas Activadas",
			value: report.alertSummary.byRule.length,
			icon: FileType,
		},
		{
			label: "Score",
			value: `${complianceScore}%`,
			icon: Shield,
		},
	];

	return (
		<div className="space-y-6">
			<PageHero
				title={report.name}
				subtitle={`${typeLabels[report.type] || report.type} | ${report.reportedMonth || "Personalizado"}`}
				icon={FileText}
				stats={stats}
			/>

			<Button
				variant="ghost"
				onClick={() => navigateTo("/reports")}
				className="gap-2"
			>
				<ArrowLeft className="h-4 w-4" />
				Volver a Reportes
			</Button>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Left column - Charts & Details */}
				<div className="lg:col-span-2 space-y-6">
					{/* Key Metrics */}
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<MetricCard
							label="Alertas Totales"
							value={report.alertSummary.total}
							icon={<AlertTriangle className="h-4 w-4" />}
						/>
						<MetricCard
							label="Críticas"
							value={criticalCount}
							icon={
								criticalCount > 0 ? (
									<TrendingUp className="h-4 w-4 text-red-500" />
								) : (
									<Minus className="h-4 w-4" />
								)
							}
							color={criticalCount > 0 ? "text-red-500" : undefined}
						/>
						<MetricCard
							label="Reglas"
							value={report.alertSummary.byRule.length}
							icon={<BarChart3 className="h-4 w-4" />}
						/>
						<MetricCard
							label="Cumplimiento"
							value={`${complianceScore}%`}
							icon={
								complianceScore >= 80 ? (
									<TrendingUp className="h-4 w-4 text-emerald-500" />
								) : complianceScore >= 60 ? (
									<Minus className="h-4 w-4 text-amber-500" />
								) : (
									<TrendingDown className="h-4 w-4 text-red-500" />
								)
							}
							color={
								complianceScore >= 80
									? "text-emerald-500"
									: complianceScore >= 60
										? "text-amber-500"
										: "text-red-500"
							}
						/>
					</div>

					{/* Charts */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<PieChartIcon className="h-5 w-5" />
								Visualización de Alertas
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-6 md:grid-cols-2">
								{severityChartData.length > 0 && (
									<DonutChart
										data={severityChartData}
										title="Por Severidad"
										width={180}
										height={180}
										centerValue={report.alertSummary.total}
										centerLabel="Total"
									/>
								)}
								{statusChartData.length > 0 && (
									<DonutChart
										data={statusChartData}
										title="Por Estado"
										width={180}
										height={180}
									/>
								)}
							</div>

							{ruleChartData.length > 0 && (
								<div className="mt-6 pt-6 border-t">
									<BarChart
										data={ruleChartData}
										title="Por Tipo de Alerta"
										width={500}
										height={200}
										horizontal
									/>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Period Info */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Calendar className="h-5 w-5" />
								Período del Reporte
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground">Inicio</p>
									<p className="font-medium">
										{new Date(report.periodStart).toLocaleDateString("es-MX", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}
									</p>
								</div>
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground">Fin</p>
									<p className="font-medium">
										{new Date(report.periodEnd).toLocaleDateString("es-MX", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}
									</p>
								</div>
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground">Tipo</p>
									<p className="font-medium">
										{typeLabels[report.type] || report.type}
									</p>
								</div>
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground">Registros</p>
									<p className="font-medium">{report.recordCount}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Alert Summary Table */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<AlertTriangle className="h-5 w-5" />
								Desglose Detallado
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-6 sm:grid-cols-2">
								<div className="space-y-3">
									<p className="text-sm font-medium text-muted-foreground">
										Por Severidad
									</p>
									{Object.entries(report.alertSummary.bySeverity).map(
										([severity, count]) => (
											<div
												key={severity}
												className="flex items-center justify-between text-sm"
											>
												<div className="flex items-center gap-2">
													<span
														className="w-2 h-2 rounded-full"
														style={{
															backgroundColor:
																SEVERITY_COLORS[severity] || "#6b7280",
														}}
													/>
													<span className="capitalize">
														{severity.toLowerCase()}
													</span>
												</div>
												<span className="font-medium tabular-nums">
													{count}
												</span>
											</div>
										),
									)}
								</div>
								<div className="space-y-3">
									<p className="text-sm font-medium text-muted-foreground">
										Por Estado
									</p>
									{Object.entries(report.alertSummary.byStatus).map(
										([status, count]) => (
											<div
												key={status}
												className="flex items-center justify-between text-sm"
											>
												<div className="flex items-center gap-2">
													<span
														className="w-2 h-2 rounded-full"
														style={{
															backgroundColor:
																STATUS_COLORS[status] || "#6b7280",
														}}
													/>
													<span className="capitalize">
														{status.toLowerCase().replace("_", " ")}
													</span>
												</div>
												<span className="font-medium tabular-nums">
													{count}
												</span>
											</div>
										),
									)}
								</div>
							</div>

							{report.alertSummary.byRule.length > 0 && (
								<div className="mt-6 pt-6 border-t space-y-3">
									<p className="text-sm font-medium text-muted-foreground">
										Por Tipo de Alerta
									</p>
									{report.alertSummary.byRule.map(
										({ ruleId, ruleName, count }) => (
											<div
												key={ruleId}
												className="flex items-center justify-between text-sm"
											>
												<span>{ruleName}</span>
												<span className="font-medium tabular-nums">
													{count}
												</span>
											</div>
										),
									)}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right column - Actions & Timeline */}
				<div className="space-y-6">
					{/* Status Card */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5" />
								Estado del Reporte
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
								<span
									className={cn(
										"flex items-center justify-center h-10 w-10 rounded-lg",
										status.bgColor,
										status.color,
									)}
								>
									{status.icon}
								</span>
								<div>
									<p className="font-medium">{status.label}</p>
									<p className="text-sm text-muted-foreground">Formato: PDF</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Timeline */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="h-5 w-5" />
								Línea de Tiempo
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-start gap-3">
								<div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
									<FileText className="h-4 w-4" />
								</div>
								<div>
									<p className="font-medium">Creado</p>
									<p className="text-sm text-muted-foreground">
										{new Date(report.createdAt).toLocaleDateString("es-MX", {
											day: "numeric",
											month: "short",
											year: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</p>
								</div>
							</div>

							{report.generatedAt && (
								<div className="flex items-start gap-3">
									<div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400">
										<FileCheck2 className="h-4 w-4" />
									</div>
									<div>
										<p className="font-medium">Generado</p>
										<p className="text-sm text-muted-foreground">
											{new Date(report.generatedAt).toLocaleDateString(
												"es-MX",
												{
													day: "numeric",
													month: "short",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												},
											)}
										</p>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Actions */}
					<Card>
						<CardHeader>
							<CardTitle>Acciones</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{report.status === "DRAFT" && (
								<Button
									className="w-full gap-2"
									onClick={handleGenerate}
									disabled={isGenerating || report.recordCount === 0}
								>
									{isGenerating ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											Generando...
										</>
									) : (
										<>
											<FileCheck2 className="h-4 w-4" />
											Generar PDF
										</>
									)}
								</Button>
							)}

							{report.status === "GENERATED" && (
								<Button
									variant="outline"
									className="w-full gap-2"
									onClick={handleDownload}
								>
									<Download className="h-4 w-4" />
									Descargar PDF
								</Button>
							)}

							{report.recordCount === 0 && report.status === "DRAFT" && (
								<p className="text-sm text-amber-500 text-center">
									No hay alertas para generar
								</p>
							)}
						</CardContent>
					</Card>

					{/* Notes */}
					{report.notes && (
						<Card>
							<CardHeader>
								<CardTitle>Notas</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground whitespace-pre-wrap">
									{report.notes}
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}

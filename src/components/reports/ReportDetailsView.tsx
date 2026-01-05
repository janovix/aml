"use client";

import { useState, useEffect } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useJwt } from "@/hooks/useJwt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	FileText,
	Calendar,
	ArrowLeft,
	Download,
	Send,
	CheckCircle2,
	Clock,
	FileCheck2,
	Loader2,
	AlertTriangle,
	FileType,
	Users,
	AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHero, type StatCard } from "@/components/page-hero";
import { PageHeroSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import {
	getReportById,
	generateReportFile,
	getReportDownloadUrl,
	submitReportToSat,
	acknowledgeReport,
	type ReportWithAlertSummary,
	type ReportStatus,
} from "@/lib/api/reports";
import { toast } from "sonner";

interface ReportDetailsViewProps {
	reportId: string;
}

/**
 * Skeleton component for ReportDetailsView
 * Used when loading the organization to show the appropriate skeleton
 */
export function ReportDetailsSkeleton(): React.ReactElement {
	return (
		<div className="space-y-6">
			<PageHeroSkeleton
				showStats={false}
				showBackButton={true}
				actionCount={3}
			/>
			{/* Content skeleton */}
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
		color: "text-sky-400",
		bgColor: "bg-sky-500/20",
	},
	SUBMITTED: {
		label: "Enviado",
		icon: <Send className="h-4 w-4" />,
		color: "text-amber-400",
		bgColor: "bg-amber-500/20",
	},
	ACKNOWLEDGED: {
		label: "Acusado",
		icon: <CheckCircle2 className="h-4 w-4" />,
		color: "text-emerald-400",
		bgColor: "bg-emerald-500/20",
	},
};

const typeLabels = {
	MONTHLY: "Mensual",
	QUARTERLY: "Trimestral",
	ANNUAL: "Anual",
	CUSTOM: "Personalizado",
};

export function ReportDetailsView({
	reportId,
}: ReportDetailsViewProps): React.ReactElement {
	const { navigateTo } = useOrgNavigation();
	const { jwt, isLoading: isJwtLoading } = useJwt();

	const [report, setReport] = useState<ReportWithAlertSummary | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showSubmitDialog, setShowSubmitDialog] = useState(false);
	const [showAcknowledgeDialog, setShowAcknowledgeDialog] = useState(false);
	const [satFolioNumber, setSatFolioNumber] = useState("");

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
			// Refresh report data
			const updated = await getReportById({ id: reportId, jwt });
			setReport(updated);
		} catch (error) {
			console.error("Error generating report:", error);
			toast.error("Error al generar el reporte");
		} finally {
			setIsGenerating(false);
		}
	};

	const handleDownload = async (format?: "xml" | "pdf") => {
		if (!jwt || !report) return;

		try {
			const { fileUrl } = await getReportDownloadUrl({
				id: report.id,
				format,
				jwt,
			});
			window.open(fileUrl, "_blank");
		} catch (error) {
			console.error("Error downloading report:", error);
			toast.error("Error al descargar el reporte");
		}
	};

	const handleSubmit = async () => {
		if (!jwt || !report) return;

		setIsSubmitting(true);
		try {
			await submitReportToSat({
				id: report.id,
				satFolioNumber: satFolioNumber || undefined,
				jwt,
			});
			toast.success("Reporte marcado como enviado");
			setShowSubmitDialog(false);
			// Refresh report data
			const updated = await getReportById({ id: reportId, jwt });
			setReport(updated);
		} catch (error) {
			console.error("Error submitting report:", error);
			toast.error("Error al marcar el reporte como enviado");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleAcknowledge = async () => {
		if (!jwt || !report || !satFolioNumber) return;

		setIsSubmitting(true);
		try {
			await acknowledgeReport({
				id: report.id,
				satFolioNumber,
				jwt,
			});
			toast.success("Acuse de SAT registrado");
			setShowAcknowledgeDialog(false);
			// Refresh report data
			const updated = await getReportById({ id: reportId, jwt });
			setReport(updated);
		} catch (error) {
			console.error("Error acknowledging report:", error);
			toast.error("Error al registrar el acuse");
		} finally {
			setIsSubmitting(false);
		}
	};

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

	const status = statusConfig[report.status];
	const isMonthly = report.type === "MONTHLY";
	// MONTHLY reports generate both XML (for SAT) and PDF (for internal use)
	const fileTypes = isMonthly ? "XML y PDF" : "PDF";

	const stats: StatCard[] = [
		{
			label: "Total Alertas",
			value: report.alertSummary.total,
			icon: AlertTriangle,
		},
		{
			label: "Alta/Crítica",
			value:
				(report.alertSummary.bySeverity["HIGH"] || 0) +
				(report.alertSummary.bySeverity["CRITICAL"] || 0),
			icon: AlertCircle,
			variant: "primary",
		},
		{
			label: "Reglas Activadas",
			value: report.alertSummary.byRule.length,
			icon: FileType,
		},
		{
			label: "Estado",
			value: status.label,
			icon: CheckCircle2,
		},
	];

	return (
		<div className="space-y-6">
			<PageHero
				title={report.name}
				subtitle={`${typeLabels[report.type]} | ${report.reportedMonth}`}
				icon={FileText}
				stats={stats}
			/>

			{/* Back button */}
			<Button
				variant="ghost"
				onClick={() => navigateTo("/reports")}
				className="gap-2"
			>
				<ArrowLeft className="h-4 w-4" />
				Volver a Reportes
			</Button>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Left column - Details */}
				<div className="lg:col-span-2 space-y-6">
					{/* Report Info */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5" />
								Información del Reporte
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground">ID</p>
									<p className="font-mono text-sm">{report.id}</p>
								</div>
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground">Tipo</p>
									<p className="font-medium">{typeLabels[report.type]}</p>
								</div>
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground">Estado</p>
									<div className="flex items-center gap-2">
										<span
											className={cn(
												"flex items-center justify-center h-6 w-6 rounded",
												status.bgColor,
												status.color,
											)}
										>
											{status.icon}
										</span>
										<span className="font-medium">{status.label}</span>
									</div>
								</div>
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground">
										Formato de Salida
									</p>
									<p className="font-medium">{fileTypes}</p>
								</div>
							</div>
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
									<p className="text-sm text-muted-foreground">
										Mes Reportado (SAT)
									</p>
									<p className="font-mono">{report.reportedMonth}</p>
								</div>
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground">
										Registros Incluidos
									</p>
									<p className="font-medium">{report.recordCount}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Alert Summary */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<AlertTriangle className="h-5 w-5" />
								Resumen de Alertas
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
												<span className="capitalize">
													{severity.toLowerCase()}
												</span>
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
												<span className="capitalize">
													{status.toLowerCase().replace("_", " ")}
												</span>
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

					{/* Notes */}
					{report.notes && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="h-5 w-5" />
									Notas
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground whitespace-pre-wrap">
									{report.notes}
								</p>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Right column - Actions */}
				<div className="space-y-6">
					{/* Status Timeline */}
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
									<div className="flex items-center justify-center h-8 w-8 rounded-full bg-sky-500/20 text-sky-400">
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

							{report.submittedAt && (
								<div className="flex items-start gap-3">
									<div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-500/20 text-amber-400">
										<Send className="h-4 w-4" />
									</div>
									<div>
										<p className="font-medium">Enviado a SAT</p>
										<p className="text-sm text-muted-foreground">
											{new Date(report.submittedAt).toLocaleDateString(
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

							{report.satFolioNumber && (
								<div className="flex items-start gap-3">
									<div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400">
										<CheckCircle2 className="h-4 w-4" />
									</div>
									<div>
										<p className="font-medium">Acuse SAT</p>
										<p className="text-sm text-muted-foreground font-mono">
											{report.satFolioNumber}
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
											Generar {fileTypes}
										</>
									)}
								</Button>
							)}

							{/* Download buttons - MONTHLY has both XML and PDF */}
							{report.status !== "DRAFT" && isMonthly && (
								<>
									<Button
										variant="outline"
										className="w-full gap-2"
										onClick={() => handleDownload("xml")}
									>
										<Download className="h-4 w-4" />
										Descargar XML (SAT)
									</Button>
									<Button
										variant="outline"
										className="w-full gap-2"
										onClick={() => handleDownload("pdf")}
									>
										<Download className="h-4 w-4" />
										Descargar PDF
									</Button>
								</>
							)}

							{/* Download button - non-MONTHLY reports only have PDF */}
							{report.status !== "DRAFT" && !isMonthly && (
								<Button
									variant="outline"
									className="w-full gap-2"
									onClick={() => handleDownload("pdf")}
								>
									<Download className="h-4 w-4" />
									Descargar PDF
								</Button>
							)}

							{report.status === "GENERATED" && isMonthly && (
								<Button
									className="w-full gap-2"
									onClick={() => setShowSubmitDialog(true)}
								>
									<Send className="h-4 w-4" />
									Marcar como Enviado a SAT
								</Button>
							)}

							{report.status === "SUBMITTED" && isMonthly && (
								<Button
									variant="outline"
									className="w-full gap-2"
									onClick={() => setShowAcknowledgeDialog(true)}
								>
									<CheckCircle2 className="h-4 w-4" />
									Registrar Acuse SAT
								</Button>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Submit Dialog */}
			<Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Marcar como Enviado a SAT</DialogTitle>
						<DialogDescription>
							Confirma que has enviado este reporte al SAT. Opcionalmente puedes
							ingresar el número de folio recibido.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="satFolio">Número de Folio (opcional)</Label>
							<Input
								id="satFolio"
								value={satFolioNumber}
								onChange={(e) => setSatFolioNumber(e.target.value)}
								placeholder="Ej: SAT-2024-12345"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowSubmitDialog(false)}
						>
							Cancelar
						</Button>
						<Button onClick={handleSubmit} disabled={isSubmitting}>
							{isSubmitting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Confirmar Envío"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Acknowledge Dialog */}
			<Dialog
				open={showAcknowledgeDialog}
				onOpenChange={setShowAcknowledgeDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Registrar Acuse del SAT</DialogTitle>
						<DialogDescription>
							Ingresa el número de folio del acuse recibido del SAT.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="acknowledgefolio">Número de Folio *</Label>
							<Input
								id="acknowledgefolio"
								value={satFolioNumber}
								onChange={(e) => setSatFolioNumber(e.target.value)}
								placeholder="Ej: SAT-ACK-2024-12345"
								required
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowAcknowledgeDialog(false)}
						>
							Cancelar
						</Button>
						<Button
							onClick={handleAcknowledge}
							disabled={isSubmitting || !satFolioNumber}
						>
							{isSubmitting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Registrar Acuse"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useJwt } from "@/hooks/useJwt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	FileText,
	Calendar,
	Save,
	ArrowLeft,
	FileType,
	AlertTriangle,
	CheckCircle2,
	Clock,
	Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/page-hero";
import {
	createReport,
	previewReport,
	calculateMonthlyPeriod,
	calculateQuarterlyPeriod,
	calculateAnnualPeriod,
	type ReportType,
	type ReportPreviewResponse,
} from "@/lib/api/reports";
import { toast } from "sonner";

interface ReportTypeOption {
	value: ReportType;
	label: string;
	description: string;
	icon: React.ReactNode;
	outputFormat: "XML" | "PDF";
	bgColor: string;
	ringColor: string;
}

const reportTypeOptions: ReportTypeOption[] = [
	{
		value: "MONTHLY",
		label: "Mensual",
		description: "Reporte regulatorio SAT (XML)",
		icon: <Calendar className="h-5 w-5" />,
		outputFormat: "XML",
		bgColor: "bg-sky-500/20 text-sky-500",
		ringColor: "ring-sky-500",
	},
	{
		value: "QUARTERLY",
		label: "Trimestral",
		description: "Reporte interno de auditoría (PDF)",
		icon: <FileText className="h-5 w-5" />,
		outputFormat: "PDF",
		bgColor: "bg-violet-500/20 text-violet-500",
		ringColor: "ring-violet-500",
	},
	{
		value: "ANNUAL",
		label: "Anual",
		description: "Resumen de cumplimiento anual (PDF)",
		icon: <FileText className="h-5 w-5" />,
		outputFormat: "PDF",
		bgColor: "bg-amber-500/20 text-amber-500",
		ringColor: "ring-amber-500",
	},
	{
		value: "CUSTOM",
		label: "Personalizado",
		description: "Rango de fechas personalizado (PDF)",
		icon: <FileType className="h-5 w-5" />,
		outputFormat: "PDF",
		bgColor: "bg-zinc-500/20 text-zinc-400",
		ringColor: "ring-zinc-500",
	},
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
	{ value: 1, label: "Enero" },
	{ value: 2, label: "Febrero" },
	{ value: 3, label: "Marzo" },
	{ value: 4, label: "Abril" },
	{ value: 5, label: "Mayo" },
	{ value: 6, label: "Junio" },
	{ value: 7, label: "Julio" },
	{ value: 8, label: "Agosto" },
	{ value: 9, label: "Septiembre" },
	{ value: 10, label: "Octubre" },
	{ value: 11, label: "Noviembre" },
	{ value: 12, label: "Diciembre" },
];
const QUARTERS: Array<{ value: 1 | 2 | 3 | 4; label: string }> = [
	{ value: 1, label: "Q1 (Ene-Mar)" },
	{ value: 2, label: "Q2 (Abr-Jun)" },
	{ value: 3, label: "Q3 (Jul-Sep)" },
	{ value: 4, label: "Q4 (Oct-Dic)" },
];

export function CreateReportView(): React.ReactElement {
	const { navigateTo } = useOrgNavigation();
	const { jwt, isLoading: isJwtLoading } = useJwt();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingPreview, setIsLoadingPreview] = useState(false);
	const [preview, setPreview] = useState<ReportPreviewResponse | null>(null);

	// Form state
	const [reportType, setReportType] = useState<ReportType>("MONTHLY");
	const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
	const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
	const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(1);
	const [customStart, setCustomStart] = useState("");
	const [customEnd, setCustomEnd] = useState("");
	const [reportName, setReportName] = useState("");
	const [notes, setNotes] = useState("");

	// Calculate period based on type and selection (memoized to prevent infinite loops)
	const period = useMemo(() => {
		switch (reportType) {
			case "MONTHLY":
				return calculateMonthlyPeriod(selectedYear, selectedMonth);
			case "QUARTERLY":
				return calculateQuarterlyPeriod(selectedYear, selectedQuarter);
			case "ANNUAL":
				return calculateAnnualPeriod(selectedYear);
			case "CUSTOM":
				if (customStart && customEnd) {
					return {
						periodStart: new Date(customStart),
						periodEnd: new Date(customEnd),
						reportedMonth: `CUSTOM_${customStart}_${customEnd}`,
						displayName: `Personalizado: ${customStart} a ${customEnd}`,
					};
				}
				return null;
			default:
				return null;
		}
	}, [
		reportType,
		selectedYear,
		selectedMonth,
		selectedQuarter,
		customStart,
		customEnd,
	]);

	// Auto-generate report name based on type and period
	useEffect(() => {
		if (period) {
			const typeLabels: Record<ReportType, string> = {
				MONTHLY: "Reporte Mensual",
				QUARTERLY: "Reporte Trimestral",
				ANNUAL: "Reporte Anual",
				CUSTOM: "Reporte Personalizado",
			};
			setReportName(`${typeLabels[reportType]} ${period.displayName}`);
		}
	}, [reportType, period]);

	// Fetch preview when period changes
	useEffect(() => {
		const fetchPreview = async () => {
			if (!jwt || !period) return;

			setIsLoadingPreview(true);
			try {
				const result = await previewReport({
					type: reportType,
					periodStart: period.periodStart.toISOString(),
					periodEnd: period.periodEnd.toISOString(),
					jwt,
				});
				setPreview(result);
			} catch (error) {
				console.error("Error fetching preview:", error);
				setPreview(null);
			} finally {
				setIsLoadingPreview(false);
			}
		};

		fetchPreview();
	}, [jwt, reportType, period]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!jwt || !period) return;

		setIsSubmitting(true);
		try {
			const report = await createReport({
				name: reportName,
				type: reportType,
				periodStart: period.periodStart.toISOString(),
				periodEnd: period.periodEnd.toISOString(),
				reportedMonth: period.reportedMonth,
				notes: notes || null,
				jwt,
			});

			toast.success("Reporte creado exitosamente");
			navigateTo(`/reports/${report.id}`);
		} catch (error) {
			console.error("Error creating report:", error);
			toast.error("Error al crear el reporte");
		} finally {
			setIsSubmitting(false);
		}
	};

	const typeOption = reportTypeOptions.find((t) => t.value === reportType);

	return (
		<div className="space-y-6">
			<PageHero
				title="Nuevo Reporte"
				subtitle="Crear un nuevo reporte de cumplimiento AML"
				icon={FileText}
			/>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Back button */}
				<Button
					type="button"
					variant="ghost"
					onClick={() => navigateTo("/reports")}
					className="gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					Volver a Reportes
				</Button>

				<div className="grid gap-6 lg:grid-cols-3">
					{/* Left column - Form */}
					<div className="lg:col-span-2 space-y-6">
						{/* Report Type Selection */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileType className="h-5 w-5" />
									Tipo de Reporte
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid gap-3 sm:grid-cols-2">
									{reportTypeOptions.map((option) => (
										<button
											key={option.value}
											type="button"
											onClick={() => setReportType(option.value)}
											className={cn(
												"flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
												reportType === option.value
													? `border-transparent ring-2 ${option.ringColor} bg-card`
													: "border-border hover:border-muted-foreground/50",
											)}
										>
											<span
												className={cn(
													"flex items-center justify-center h-10 w-10 rounded-lg",
													option.bgColor,
												)}
											>
												{option.icon}
											</span>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<span className="font-medium">{option.label}</span>
													<span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
														{option.outputFormat}
													</span>
												</div>
												<p className="text-sm text-muted-foreground mt-0.5">
													{option.description}
												</p>
											</div>
											{reportType === option.value && (
												<CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
											)}
										</button>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Period Selection */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Calendar className="h-5 w-5" />
									Período del Reporte
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{reportType === "MONTHLY" && (
									<div className="grid gap-4 sm:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="year">Año</Label>
											<Select
												value={String(selectedYear)}
												onValueChange={(v) => setSelectedYear(Number(v))}
											>
												<SelectTrigger id="year">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{YEARS.map((y) => (
														<SelectItem key={y} value={String(y)}>
															{y}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label htmlFor="month">Mes</Label>
											<Select
												value={String(selectedMonth)}
												onValueChange={(v) => setSelectedMonth(Number(v))}
											>
												<SelectTrigger id="month">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{MONTHS.map((m) => (
														<SelectItem key={m.value} value={String(m.value)}>
															{m.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
								)}

								{reportType === "QUARTERLY" && (
									<div className="grid gap-4 sm:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="year">Año</Label>
											<Select
												value={String(selectedYear)}
												onValueChange={(v) => setSelectedYear(Number(v))}
											>
												<SelectTrigger id="year">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{YEARS.map((y) => (
														<SelectItem key={y} value={String(y)}>
															{y}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label htmlFor="quarter">Trimestre</Label>
											<Select
												value={String(selectedQuarter)}
												onValueChange={(v) =>
													setSelectedQuarter(Number(v) as 1 | 2 | 3 | 4)
												}
											>
												<SelectTrigger id="quarter">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{QUARTERS.map((q) => (
														<SelectItem key={q.value} value={String(q.value)}>
															{q.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
								)}

								{reportType === "ANNUAL" && (
									<div className="space-y-2">
										<Label htmlFor="year">Año</Label>
										<Select
											value={String(selectedYear)}
											onValueChange={(v) => setSelectedYear(Number(v))}
										>
											<SelectTrigger id="year" className="w-full sm:w-48">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{YEARS.map((y) => (
													<SelectItem key={y} value={String(y)}>
														{y}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								)}

								{reportType === "CUSTOM" && (
									<div className="grid gap-4 sm:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="customStart">Fecha inicio</Label>
											<Input
												id="customStart"
												type="date"
												value={customStart}
												onChange={(e) => setCustomStart(e.target.value)}
												required
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="customEnd">Fecha fin</Label>
											<Input
												id="customEnd"
												type="date"
												value={customEnd}
												onChange={(e) => setCustomEnd(e.target.value)}
												required
											/>
										</div>
									</div>
								)}

								{/* Period display */}
								{period && (
									<div className="p-3 rounded-lg bg-muted/50 border">
										<p className="text-sm text-muted-foreground">
											Período seleccionado:
										</p>
										<p className="font-medium">
											{period.periodStart.toLocaleDateString("es-MX", {
												day: "numeric",
												month: "long",
												year: "numeric",
											})}{" "}
											-{" "}
											{period.periodEnd.toLocaleDateString("es-MX", {
												day: "numeric",
												month: "long",
												year: "numeric",
											})}
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Report Details */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									Detalles del Reporte
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="name">Nombre del Reporte</Label>
									<Input
										id="name"
										value={reportName}
										onChange={(e) => setReportName(e.target.value)}
										placeholder="Nombre del reporte"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="notes">Notas (opcional)</Label>
									<Textarea
										id="notes"
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										placeholder="Notas adicionales sobre este reporte..."
										rows={3}
									/>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right column - Preview */}
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<AlertTriangle className="h-5 w-5" />
									Vista Previa
								</CardTitle>
							</CardHeader>
							<CardContent>
								{isLoadingPreview || isJwtLoading ? (
									<div className="flex items-center justify-center py-8">
										<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
									</div>
								) : preview ? (
									<div className="space-y-4">
										<div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
											<span className="text-sm font-medium">Total Alertas</span>
											<span className="text-2xl font-bold text-primary">
												{preview.total}
											</span>
										</div>

										{preview.total > 0 && (
											<>
												<div className="space-y-2">
													<p className="text-sm font-medium text-muted-foreground">
														Por Severidad
													</p>
													{Object.entries(preview.bySeverity).map(
														([severity, count]) => (
															<div
																key={severity}
																className="flex items-center justify-between text-sm"
															>
																<span className="capitalize">
																	{severity.toLowerCase()}
																</span>
																<span className="font-medium">{count}</span>
															</div>
														),
													)}
												</div>

												<div className="space-y-2">
													<p className="text-sm font-medium text-muted-foreground">
														Por Estado
													</p>
													{Object.entries(preview.byStatus).map(
														([status, count]) => (
															<div
																key={status}
																className="flex items-center justify-between text-sm"
															>
																<span className="capitalize">
																	{status.toLowerCase().replace("_", " ")}
																</span>
																<span className="font-medium">{count}</span>
															</div>
														),
													)}
												</div>
											</>
										)}

										{preview.total === 0 && (
											<div className="flex items-center gap-2 text-amber-500 text-sm">
												<Clock className="h-4 w-4" />
												<span>No hay alertas en este período</span>
											</div>
										)}
									</div>
								) : (
									<div className="text-center py-8 text-muted-foreground">
										<FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
										<p className="text-sm">
											Selecciona un período para ver la vista previa
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Output Format Info */}
						{typeOption && (
							<Card>
								<CardContent className="pt-6">
									<div className="flex items-start gap-3">
										<span
											className={cn(
												"flex items-center justify-center h-10 w-10 rounded-lg",
												typeOption.bgColor,
											)}
										>
											{typeOption.icon}
										</span>
										<div>
											<p className="font-medium">{typeOption.label}</p>
											<p className="text-sm text-muted-foreground">
												Formato de salida:{" "}
												<span className="font-medium">
													{typeOption.outputFormat}
												</span>
											</p>
											{reportType === "MONTHLY" && (
												<p className="text-xs text-muted-foreground mt-1">
													Este reporte genera un archivo XML para envío al SAT
												</p>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Submit Button */}
						<Button
							type="submit"
							className="w-full gap-2"
							size="lg"
							disabled={isSubmitting || !period || isJwtLoading}
						>
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Creando...
								</>
							) : (
								<>
									<Save className="h-4 w-4" />
									Crear Reporte
								</>
							)}
						</Button>
					</div>
				</div>
			</form>
		</div>
	);
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useJwt } from "@/hooks/useJwt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
	ArrowRight,
	AlertTriangle,
	CheckCircle2,
	Clock,
	Loader2,
	BarChart3,
	Users,
	Briefcase,
	TrendingUp,
	Shield,
	GitCompare,
	LayoutTemplate,
	Filter,
	PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/page-hero";
import {
	createReport,
	previewReport,
	calculateQuarterlyPeriod,
	calculateAnnualPeriod,
	type ReportType,
	type ReportPreviewResponse,
} from "@/lib/api/reports";
import { toast } from "sonner";

// Report Templates
interface ReportTemplate {
	id: string;
	name: string;
	description: string;
	icon: React.ReactNode;
	dataSources: DataSource[];
	defaultFilters: boolean;
	supportsComparison: boolean;
	bgColor: string;
	ringColor: string;
}

type DataSource = "ALERTS" | "TRANSACTIONS" | "CLIENTS" | "ALL";

const reportTemplates: ReportTemplate[] = [
	{
		id: "EXECUTIVE_SUMMARY",
		name: "Resumen Ejecutivo",
		description: "Vista consolidada de métricas clave para directivos",
		icon: <BarChart3 className="h-5 w-5" />,
		dataSources: ["ALL"],
		defaultFilters: false,
		supportsComparison: true,
		bgColor: "bg-blue-500/20 text-blue-500",
		ringColor: "ring-blue-500",
	},
	{
		id: "COMPLIANCE_STATUS",
		name: "Estado de Cumplimiento",
		description: "Indicadores de cumplimiento y score organizacional",
		icon: <Shield className="h-5 w-5" />,
		dataSources: ["ALERTS", "TRANSACTIONS"],
		defaultFilters: false,
		supportsComparison: true,
		bgColor: "bg-emerald-500/20 text-emerald-500",
		ringColor: "ring-emerald-500",
	},
	{
		id: "TRANSACTION_ANALYSIS",
		name: "Análisis de Transacciones",
		description: "Desglose detallado de transacciones por tipo y cliente",
		icon: <Briefcase className="h-5 w-5" />,
		dataSources: ["TRANSACTIONS"],
		defaultFilters: true,
		supportsComparison: true,
		bgColor: "bg-violet-500/20 text-violet-500",
		ringColor: "ring-violet-500",
	},
	{
		id: "CLIENT_RISK_PROFILE",
		name: "Perfil de Riesgo de Clientes",
		description: "Análisis de riesgo por cliente y segmento",
		icon: <Users className="h-5 w-5" />,
		dataSources: ["CLIENTS", "ALERTS"],
		defaultFilters: true,
		supportsComparison: false,
		bgColor: "bg-amber-500/20 text-amber-500",
		ringColor: "ring-amber-500",
	},
	{
		id: "ALERT_BREAKDOWN",
		name: "Desglose de Alertas",
		description: "Análisis detallado de alertas por regla y severidad",
		icon: <AlertTriangle className="h-5 w-5" />,
		dataSources: ["ALERTS"],
		defaultFilters: true,
		supportsComparison: true,
		bgColor: "bg-rose-500/20 text-rose-500",
		ringColor: "ring-rose-500",
	},
	{
		id: "PERIOD_COMPARISON",
		name: "Comparación de Períodos",
		description: "Comparativa de métricas entre dos períodos",
		icon: <GitCompare className="h-5 w-5" />,
		dataSources: ["ALL"],
		defaultFilters: false,
		supportsComparison: true,
		bgColor: "bg-cyan-500/20 text-cyan-500",
		ringColor: "ring-cyan-500",
	},
];

// Period types for reports
type PeriodType = "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM";

interface PeriodOption {
	value: PeriodType;
	label: string;
	description: string;
}

const periodOptions: PeriodOption[] = [
	{
		value: "MONTHLY",
		label: "Mensual",
		description: "Período de un mes calendario",
	},
	{
		value: "QUARTERLY",
		label: "Trimestral",
		description: "Período de un trimestre",
	},
	{
		value: "ANNUAL",
		label: "Anual",
		description: "Período de un año completo",
	},
	{
		value: "CUSTOM",
		label: "Personalizado",
		description: "Rango de fechas personalizado",
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

// Wizard steps
const STEPS = ["template", "period", "options", "review"] as const;
type Step = (typeof STEPS)[number];

export function CreateReportView(): React.ReactElement {
	const { navigateTo } = useOrgNavigation();
	const { jwt, isLoading: isJwtLoading } = useJwt();

	const [currentStep, setCurrentStep] = useState<Step>("template");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingPreview, setIsLoadingPreview] = useState(false);
	const [preview, setPreview] = useState<ReportPreviewResponse | null>(null);

	// Form state
	const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
	const [periodType, setPeriodType] = useState<PeriodType>("MONTHLY");
	const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
	const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
	const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(1);
	const [customStart, setCustomStart] = useState("");
	const [customEnd, setCustomEnd] = useState("");
	const [reportName, setReportName] = useState("");
	const [notes, setNotes] = useState("");
	const [includeCharts, setIncludeCharts] = useState(true);
	const [enableComparison, setEnableComparison] = useState(false);
	const [comparisonStart, setComparisonStart] = useState("");
	const [comparisonEnd, setComparisonEnd] = useState("");

	const template = reportTemplates.find((t) => t.id === selectedTemplate);

	// Calculate period based on type and selection
	const period = useMemo(() => {
		switch (periodType) {
			case "MONTHLY":
				// Use standard calendar month (1st to last day)
				const start = new Date(
					Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0),
				);
				const end = new Date(
					Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999),
				);
				const monthName =
					MONTHS.find((m) => m.value === selectedMonth)?.label || "";
				return {
					periodStart: start,
					periodEnd: end,
					reportedMonth: `${selectedYear}${String(selectedMonth).padStart(2, "0")}`,
					displayName: `${monthName} ${selectedYear}`,
				};
			case "QUARTERLY":
				return calculateQuarterlyPeriod(selectedYear, selectedQuarter);
			case "ANNUAL":
				return calculateAnnualPeriod(selectedYear);
			case "CUSTOM":
				if (customStart && customEnd) {
					return {
						periodStart: new Date(customStart),
						periodEnd: new Date(customEnd),
						reportedMonth: `CUSTOM`,
						displayName: `${customStart} a ${customEnd}`,
					};
				}
				return null;
			default:
				return null;
		}
	}, [
		periodType,
		selectedYear,
		selectedMonth,
		selectedQuarter,
		customStart,
		customEnd,
	]);

	// Auto-generate report name based on template and period
	useEffect(() => {
		if (template && period) {
			setReportName(`${template.name} - ${period.displayName}`);
		}
	}, [template, period]);

	// Fetch preview when period changes
	useEffect(() => {
		const fetchPreview = async () => {
			if (!jwt || !period || !selectedTemplate) return;

			setIsLoadingPreview(true);
			try {
				const result = await previewReport({
					type: periodType as ReportType,
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
	}, [jwt, period, selectedTemplate, periodType]);

	const handleSubmit = async () => {
		if (!jwt || !period || !selectedTemplate) return;

		setIsSubmitting(true);
		try {
			const report = await createReport({
				name: reportName,
				type: periodType as ReportType,
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

	const canProceed = () => {
		switch (currentStep) {
			case "template":
				return !!selectedTemplate;
			case "period":
				return !!period;
			case "options":
				return !!reportName;
			case "review":
				return true;
			default:
				return false;
		}
	};

	const goToNextStep = () => {
		const currentIndex = STEPS.indexOf(currentStep);
		if (currentIndex < STEPS.length - 1) {
			setCurrentStep(STEPS[currentIndex + 1]);
		}
	};

	const goToPrevStep = () => {
		const currentIndex = STEPS.indexOf(currentStep);
		if (currentIndex > 0) {
			setCurrentStep(STEPS[currentIndex - 1]);
		}
	};

	const renderStepIndicator = () => (
		<div className="flex items-center justify-center gap-2 mb-8">
			{STEPS.map((step, index) => {
				const isActive = step === currentStep;
				const isPast = STEPS.indexOf(step) < STEPS.indexOf(currentStep);
				return (
					<div key={step} className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => isPast && setCurrentStep(step)}
							disabled={!isPast}
							className={cn(
								"flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium transition-colors",
								isActive && "bg-primary text-primary-foreground",
								isPast &&
									"bg-primary/20 text-primary cursor-pointer hover:bg-primary/30",
								!isActive && !isPast && "bg-muted text-muted-foreground",
							)}
						>
							{isPast ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
						</button>
						{index < STEPS.length - 1 && (
							<div
								className={cn("h-0.5 w-8", isPast ? "bg-primary" : "bg-muted")}
							/>
						)}
					</div>
				);
			})}
		</div>
	);

	const renderTemplateStep = () => (
		<div className="space-y-6">
			<div className="text-center mb-8">
				<h2 className="text-xl font-semibold mb-2">Selecciona una Plantilla</h2>
				<p className="text-muted-foreground">
					Elige el tipo de reporte que deseas generar
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{reportTemplates.map((tmpl) => (
					<button
						key={tmpl.id}
						type="button"
						onClick={() => setSelectedTemplate(tmpl.id)}
						className={cn(
							"flex flex-col items-start gap-3 p-4 rounded-lg border-2 text-left transition-all h-full",
							selectedTemplate === tmpl.id
								? `border-transparent ring-2 ${tmpl.ringColor} bg-card`
								: "border-border hover:border-muted-foreground/50",
						)}
					>
						<div className="flex items-start justify-between w-full">
							<span
								className={cn(
									"flex items-center justify-center h-10 w-10 rounded-lg",
									tmpl.bgColor,
								)}
							>
								{tmpl.icon}
							</span>
							{selectedTemplate === tmpl.id && (
								<CheckCircle2 className="h-5 w-5 text-primary" />
							)}
						</div>
						<div>
							<span className="font-medium">{tmpl.name}</span>
							<p className="text-sm text-muted-foreground mt-1">
								{tmpl.description}
							</p>
						</div>
						<div className="flex flex-wrap gap-1 mt-auto">
							{tmpl.dataSources.map((ds) => (
								<span
									key={ds}
									className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
								>
									{ds === "ALL"
										? "Todos"
										: ds === "ALERTS"
											? "Alertas"
											: ds === "TRANSACTIONS"
												? "Txns"
												: "Clientes"}
								</span>
							))}
							{tmpl.supportsComparison && (
								<span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500">
									<TrendingUp className="h-3 w-3 inline mr-0.5" />
									Comparar
								</span>
							)}
						</div>
					</button>
				))}
			</div>
		</div>
	);

	const renderPeriodStep = () => (
		<div className="space-y-6 max-w-2xl mx-auto">
			<div className="text-center mb-8">
				<h2 className="text-xl font-semibold mb-2">Define el Período</h2>
				<p className="text-muted-foreground">
					Selecciona el rango de fechas para el reporte
				</p>
			</div>

			<Card>
				<CardContent className="pt-6 space-y-6">
					<div className="grid gap-3 sm:grid-cols-2">
						{periodOptions.map((opt) => (
							<button
								key={opt.value}
								type="button"
								onClick={() => setPeriodType(opt.value)}
								className={cn(
									"flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
									periodType === opt.value
										? "border-primary bg-primary/5"
										: "border-border hover:border-muted-foreground/50",
								)}
							>
								<Calendar
									className={cn(
										"h-5 w-5",
										periodType === opt.value
											? "text-primary"
											: "text-muted-foreground",
									)}
								/>
								<div>
									<span className="font-medium text-sm">{opt.label}</span>
									<p className="text-xs text-muted-foreground">
										{opt.description}
									</p>
								</div>
							</button>
						))}
					</div>

					<div className="border-t pt-6">
						{periodType === "MONTHLY" && (
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

						{periodType === "QUARTERLY" && (
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

						{periodType === "ANNUAL" && (
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

						{periodType === "CUSTOM" && (
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
					</div>

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
		</div>
	);

	const renderOptionsStep = () => (
		<div className="space-y-6 max-w-2xl mx-auto">
			<div className="text-center mb-8">
				<h2 className="text-xl font-semibold mb-2">Opciones del Reporte</h2>
				<p className="text-muted-foreground">
					Personaliza el contenido y formato del reporte
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Información General
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

			<Card>
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<PieChart className="h-5 w-5" />
						Visualización
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<Label htmlFor="charts">Incluir Gráficas</Label>
							<p className="text-sm text-muted-foreground">
								Añade visualizaciones de datos al reporte PDF
							</p>
						</div>
						<Switch
							id="charts"
							checked={includeCharts}
							onCheckedChange={setIncludeCharts}
						/>
					</div>

					{template?.supportsComparison && (
						<>
							<div className="border-t pt-4">
								<div className="flex items-center justify-between">
									<div>
										<Label htmlFor="comparison">Comparación de Períodos</Label>
										<p className="text-sm text-muted-foreground">
											Compara con un período anterior
										</p>
									</div>
									<Switch
										id="comparison"
										checked={enableComparison}
										onCheckedChange={setEnableComparison}
									/>
								</div>
							</div>

							{enableComparison && (
								<div className="grid gap-4 sm:grid-cols-2 pt-2">
									<div className="space-y-2">
										<Label htmlFor="compStart">
											Período comparación - Inicio
										</Label>
										<Input
											id="compStart"
											type="date"
											value={comparisonStart}
											onChange={(e) => setComparisonStart(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="compEnd">Período comparación - Fin</Label>
										<Input
											id="compEnd"
											type="date"
											value={comparisonEnd}
											onChange={(e) => setComparisonEnd(e.target.value)}
										/>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);

	const renderReviewStep = () => (
		<div className="space-y-6 max-w-3xl mx-auto">
			<div className="text-center mb-8">
				<h2 className="text-xl font-semibold mb-2">Revisar y Crear</h2>
				<p className="text-muted-foreground">
					Verifica la configuración antes de crear el reporte
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<LayoutTemplate className="h-5 w-5" />
							Configuración del Reporte
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{template && (
							<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
								<span
									className={cn(
										"flex items-center justify-center h-10 w-10 rounded-lg",
										template.bgColor,
									)}
								>
									{template.icon}
								</span>
								<div>
									<p className="font-medium">{template.name}</p>
									<p className="text-sm text-muted-foreground">
										{template.description}
									</p>
								</div>
							</div>
						)}

						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Nombre</p>
							<p className="font-medium">{reportName}</p>
						</div>

						{period && (
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Período</p>
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

						<div className="flex items-center gap-4 text-sm">
							<span
								className={cn(
									"flex items-center gap-1",
									includeCharts ? "text-emerald-500" : "text-muted-foreground",
								)}
							>
								<PieChart className="h-4 w-4" />
								{includeCharts ? "Con gráficas" : "Sin gráficas"}
							</span>
							{template?.supportsComparison && (
								<span
									className={cn(
										"flex items-center gap-1",
										enableComparison
											? "text-cyan-500"
											: "text-muted-foreground",
									)}
								>
									<TrendingUp className="h-4 w-4" />
									{enableComparison ? "Con comparación" : "Sin comparación"}
								</span>
							)}
						</div>

						{notes && (
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Notas</p>
								<p className="text-sm">{notes}</p>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<AlertTriangle className="h-5 w-5" />
							Vista Previa de Datos
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
								<p className="text-sm">Vista previa no disponible</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);

	return (
		<div className="space-y-6">
			<PageHero
				title="Nuevo Reporte"
				subtitle="Crea un reporte de análisis personalizado"
				icon={FileText}
			/>

			<Button
				type="button"
				variant="ghost"
				onClick={() => navigateTo("/reports")}
				className="gap-2"
			>
				<ArrowLeft className="h-4 w-4" />
				Volver a Reportes
			</Button>

			{renderStepIndicator()}

			<div className="min-h-[400px]">
				{currentStep === "template" && renderTemplateStep()}
				{currentStep === "period" && renderPeriodStep()}
				{currentStep === "options" && renderOptionsStep()}
				{currentStep === "review" && renderReviewStep()}
			</div>

			<div className="flex justify-between pt-6 border-t">
				<Button
					type="button"
					variant="outline"
					onClick={goToPrevStep}
					disabled={currentStep === "template"}
				>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Anterior
				</Button>

				{currentStep === "review" ? (
					<Button
						onClick={handleSubmit}
						disabled={isSubmitting || !canProceed() || isJwtLoading}
						className="gap-2"
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
				) : (
					<Button onClick={goToNextStep} disabled={!canProceed()}>
						Siguiente
						<ArrowRight className="h-4 w-4 ml-2" />
					</Button>
				)}
			</div>
		</div>
	);
}

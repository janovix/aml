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
import { extractErrorMessage } from "@/lib/mutations";
import { useLanguage } from "@/components/LanguageProvider";
import type { TranslationKeys } from "@/lib/translations";

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

type DataSource = "ALERTS" | "OPERATIONS" | "CLIENTS" | "ALL";

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
		dataSources: ["ALERTS", "OPERATIONS"],
		defaultFilters: false,
		supportsComparison: true,
		bgColor: "bg-emerald-500/20 text-emerald-500",
		ringColor: "ring-emerald-500",
	},
	{
		id: "OPERATION_ANALYSIS",
		name: "Análisis de Operaciones",
		description: "Desglose detallado de operaciones por tipo y cliente",
		icon: <Briefcase className="h-5 w-5" />,
		dataSources: ["OPERATIONS"],
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
	label: TranslationKeys;
	description: TranslationKeys;
}

const periodOptions: PeriodOption[] = [
	{
		value: "MONTHLY",
		label: "reportTypeMonthly",
		description: "reportMonthlyPeriod",
	},
	{
		value: "QUARTERLY",
		label: "reportTypeQuarterly",
		description: "reportQuarterlyPeriod",
	},
	{
		value: "ANNUAL",
		label: "reportTypeAnnual",
		description: "reportAnnualPeriod",
	},
	{
		value: "CUSTOM",
		label: "reportTypeCustom",
		description: "reportCustomPeriod",
	},
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
	{ value: 1, label: "monthJanuary" },
	{ value: 2, label: "monthFebruary" },
	{ value: 3, label: "monthMarch" },
	{ value: 4, label: "monthApril" },
	{ value: 5, label: "monthMay" },
	{ value: 6, label: "monthJune" },
	{ value: 7, label: "monthJuly" },
	{ value: 8, label: "monthAugust" },
	{ value: 9, label: "monthSeptember" },
	{ value: 10, label: "monthOctober" },
	{ value: 11, label: "monthNovember" },
	{ value: 12, label: "monthDecember" },
] as const;
const QUARTERS: Array<{ value: 1 | 2 | 3 | 4; label: TranslationKeys }> = [
	{ value: 1, label: "reportQ1" },
	{ value: 2, label: "reportQ2" },
	{ value: 3, label: "reportQ3" },
	{ value: 4, label: "reportQ4" },
];

// Wizard steps
const STEPS = ["template", "period", "options", "review"] as const;
type Step = (typeof STEPS)[number];

export function CreateReportView(): React.ReactElement {
	const { navigateTo } = useOrgNavigation();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { t } = useLanguage();

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

	const template = reportTemplates.find((tmpl) => tmpl.id === selectedTemplate);

	// Translation overrides for constants defined outside the component
	const templateNameOverrides: Record<string, string> = {
		ALERT_BREAKDOWN: t("reportAlertBreakdown"),
		PERIOD_COMPARISON: t("reportPeriodComparison"),
	};
	// periodOptions descriptions are now translation keys, resolved via t()

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
				const monthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label;
				const monthName = monthLabel ? t(monthLabel) : "";
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
			const name = templateNameOverrides[template.id] ?? template.name;
			setReportName(`${name} - ${period.displayName}`);
		}
	}, [template, period, templateNameOverrides]);

	// Fetch preview when period changes
	useEffect(() => {
		const fetchPreview = async () => {
			if (!jwt || !period || !selectedTemplate) return;

			setIsLoadingPreview(true);
			try {
				const result = await previewReport({
					periodType: periodType as ReportType,
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
				periodType: periodType as ReportType,
				periodStart: period.periodStart.toISOString(),
				periodEnd: period.periodEnd.toISOString(),
				reportedMonth: period.reportedMonth,
				notes: notes || null,
				jwt,
			});

			toast.success(t("reportCreatedSuccess"));
			navigateTo(`/reports/${report.id}`);
		} catch (error) {
			console.error("Error creating report:", error);
			toast.error(extractErrorMessage(error), { id: "create-report" });
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
				<h2 className="text-xl font-semibold mb-2">
					{t("reportSelectTemplate")}
				</h2>
				<p className="text-muted-foreground">{t("reportSelectTemplateDesc")}</p>
			</div>
			<div className="grid gap-4 @sm/main:grid-cols-2 @lg/main:grid-cols-3">
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
							<span className="font-medium">
								{templateNameOverrides[tmpl.id] ?? tmpl.name}
							</span>
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
										? t("reportAllDataSource")
										: ds === "ALERTS"
											? t("noticeAlerts")
											: ds === "OPERATIONS"
												? t("reportOpsDataSource")
												: t("reportClientsDataSource")}
								</span>
							))}
							{tmpl.supportsComparison && (
								<span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500">
									<TrendingUp className="h-3 w-3 inline mr-0.5" />
									{t("reportCompare")}
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
				<h2 className="text-xl font-semibold mb-2">
					{t("reportDefinePeriod")}
				</h2>
				<p className="text-muted-foreground">{t("reportSelectDateRange")}</p>
			</div>

			<Card>
				<CardContent className="pt-6 space-y-6">
					<div className="grid gap-3 @sm/main:grid-cols-2">
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
									<span className="font-medium text-sm">{t(opt.label)}</span>
									<p className="text-xs text-muted-foreground">
										{t(opt.description)}
									</p>
								</div>
							</button>
						))}
					</div>

					<div className="border-t pt-6">
						{periodType === "MONTHLY" && (
							<div className="grid gap-4 @sm/main:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="year">{t("reportYear")}</Label>
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
									<Label htmlFor="month">{t("reportMonth")}</Label>
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
													{t(m.label)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						)}

						{periodType === "QUARTERLY" && (
							<div className="grid gap-4 @sm/main:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="year">{t("reportYear")}</Label>
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
									<Label htmlFor="quarter">{t("reportQuarter")}</Label>
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
													{t(q.label)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						)}

						{periodType === "ANNUAL" && (
							<div className="space-y-2">
								<Label htmlFor="year">{t("reportYear")}</Label>
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
							<div className="grid gap-4 @sm/main:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="customStart">{t("reportStartDate")}</Label>
									<Input
										id="customStart"
										type="date"
										value={customStart}
										onChange={(e) => setCustomStart(e.target.value)}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="customEnd">{t("reportEndDate")}</Label>
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
								{t("reportSelectedPeriod")}
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
				<h2 className="text-xl font-semibold mb-2">{t("reportOptions")}</h2>
				<p className="text-muted-foreground">{t("reportOptionsDesc")}</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<FileText className="h-5 w-5" />
						{t("reportGeneralInfo")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">{t("reportName")}</Label>
						<Input
							id="name"
							value={reportName}
							onChange={(e) => setReportName(e.target.value)}
							placeholder={t("reportName")}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="notes">{t("reportNotesLabel")}</Label>
						<Textarea
							id="notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder={t("reportNotesPlaceholder")}
							rows={3}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<PieChart className="h-5 w-5" />
						{t("reportVisualization")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<Label htmlFor="charts">{t("reportIncludeCharts")}</Label>
							<p className="text-sm text-muted-foreground">
								{t("reportIncludeChartsDesc")}
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
										<Label htmlFor="comparison">
											{t("reportPeriodComparison")}
										</Label>
										<p className="text-sm text-muted-foreground">
											{t("reportCompareWithPrevious")}
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
								<div className="grid gap-4 @sm/main:grid-cols-2 pt-2">
									<div className="space-y-2">
										<Label htmlFor="compStart">
											{t("reportComparisonPeriodStart")}
										</Label>
										<Input
											id="compStart"
											type="date"
											value={comparisonStart}
											onChange={(e) => setComparisonStart(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="compEnd">
											{t("reportComparisonPeriodEnd")}
										</Label>
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
				<h2 className="text-xl font-semibold mb-2">
					{t("reportReviewAndCreate")}
				</h2>
				<p className="text-muted-foreground">{t("reportReviewDesc")}</p>
			</div>

			<div className="grid gap-6 @xl/main:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<LayoutTemplate className="h-5 w-5" />
							{t("reportConfiguration")}
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
									<p className="font-medium">
										{templateNameOverrides[template.id] ?? template.name}
									</p>
									<p className="text-sm text-muted-foreground">
										{template.description}
									</p>
								</div>
							</div>
						)}

						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">
								{t("reportNameLabel2")}
							</p>
							<p className="font-medium">{reportName}</p>
						</div>

						{period && (
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">
									{t("reportPeriod")}
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

						<div className="flex items-center gap-4 text-sm">
							<span
								className={cn(
									"flex items-center gap-1",
									includeCharts ? "text-emerald-500" : "text-muted-foreground",
								)}
							>
								<PieChart className="h-4 w-4" />
								{includeCharts
									? t("reportWithCharts")
									: t("reportWithoutCharts")}
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
									{enableComparison
										? t("reportWithComparison")
										: t("reportWithoutComparison")}
								</span>
							)}
						</div>

						{notes && (
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">
									{t("reportNotesLabel")}
								</p>
								<p className="text-sm">{notes}</p>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<AlertTriangle className="h-5 w-5" />
							{t("reportDataPreview")}
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
									<span className="text-sm font-medium">
										{t("reportTotalAlerts")}
									</span>
									<span className="text-2xl font-bold text-primary">
										{preview.total}
									</span>
								</div>

								{preview.total > 0 && (
									<>
										<div className="space-y-2">
											<p className="text-sm font-medium text-muted-foreground">
												{t("reportBySeverity")}
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
												{t("reportByStatus")}
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
										<span>{t("reportNoAlertsInPeriod")}</span>
									</div>
								)}
							</div>
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p className="text-sm">{t("reportPreviewNotAvailable")}</p>
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
				title={t("reportNewTitle")}
				subtitle={t("reportNewSubtitle")}
				icon={FileText}
			/>

			<Button
				type="button"
				variant="ghost"
				onClick={() => navigateTo("/reports")}
				className="gap-2"
			>
				<ArrowLeft className="h-4 w-4" />
				{t("reportBackToReports")}
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
					{t("reportPrevious")}
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
								{t("reportCreating")}
							</>
						) : (
							<>
								<Save className="h-4 w-4" />
								{t("reportCreateButton")}
							</>
						)}
					</Button>
				) : (
					<Button onClick={goToNextStep} disabled={!canProceed()}>
						{t("next")}
						<ArrowRight className="h-4 w-4 ml-2" />
					</Button>
				)}
			</div>
		</div>
	);
}

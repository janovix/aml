"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
	FileWarning,
	Calendar,
	ArrowLeft,
	Loader2,
	Clock,
	AlertTriangle,
	Info,
} from "lucide-react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useJwt } from "@/hooks/useJwt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableCaption,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { extractErrorMessage, showUsageLimitToast } from "@/lib/mutations";
import { isUsageLimitError } from "@/lib/api/http";
import { showFetchError } from "@/lib/toast-utils";
import { useLanguage } from "@/components/LanguageProvider";
import {
	createNotice,
	previewNotice,
	getAvailableMonths,
	calculateNoticePeriod,
	type AvailableMonth,
	type NoticePreviewResponse,
} from "@/lib/api/notices";

export function CreateNoticeView(): React.ReactElement {
	const router = useRouter();
	const { navigateTo } = useOrgNavigation();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { t } = useLanguage();

	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isPreviewLoading, setIsPreviewLoading] = useState(false);
	const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
	const [selectedMonth, setSelectedMonth] = useState<string>("");
	const [name, setName] = useState("");
	const [notes, setNotes] = useState("");
	const [preview, setPreview] = useState<NoticePreviewResponse | null>(null);
	const [selectedAlertIds, setSelectedAlertIds] = useState<Set<string>>(
		new Set(),
	);
	const [emptyConfirmed, setEmptyConfirmed] = useState(false);

	// Load available months
	useEffect(() => {
		if (!jwt || isJwtLoading) return;

		const loadAvailableMonths = async () => {
			try {
				setIsLoading(true);
				const response = await getAvailableMonths({ jwt });
				setAvailableMonths(response.months);

				// Select first available month without a pending notice
				const firstAvailable = response.months.find((m) => !m.hasPendingNotice);
				if (firstAvailable) {
					const key = `${firstAvailable.year}-${firstAvailable.month}`;
					setSelectedMonth(key);
					setName(`Aviso ${firstAvailable.displayName}`);
				}
			} catch (error) {
				console.error("Error loading available months:", error);
				showFetchError("create-notice-load", error);
			} finally {
				setIsLoading(false);
			}
		};

		loadAvailableMonths();
	}, [jwt, isJwtLoading]);

	useEffect(() => {
		if (!jwt || !selectedMonth) {
			setPreview(null);
			setSelectedAlertIds(new Set());
			setEmptyConfirmed(false);
			return;
		}

		const [year, month] = selectedMonth.split("-").map(Number);
		if (!year || !month) return;

		const loadPreview = async () => {
			try {
				setIsPreviewLoading(true);
				const response = await previewNotice({ year, month, jwt });
				setPreview(response);
				setSelectedAlertIds(new Set(response.alerts.map((a) => a.id)));
				setEmptyConfirmed(false);
			} catch (error) {
				console.error("Error loading preview:", error);
				setPreview(null);
				setSelectedAlertIds(new Set());
			} finally {
				setIsPreviewLoading(false);
			}
		};

		loadPreview();
	}, [jwt, selectedMonth]);

	const handleMonthChange = useCallback(
		(value: string) => {
			setSelectedMonth(value);
			const month = availableMonths.find(
				(m) => `${m.year}-${m.month}` === value,
			);
			if (month) {
				setName(`Aviso ${month.displayName}`);
			}
		},
		[availableMonths],
	);

	const toggleAlert = useCallback((alertId: string) => {
		setSelectedAlertIds((prev) => {
			const next = new Set(prev);
			if (next.has(alertId)) {
				next.delete(alertId);
			} else {
				next.add(alertId);
			}
			return next;
		});
		setEmptyConfirmed((v) => (v ? false : v));
	}, []);

	const toggleAll = useCallback(() => {
		if (!preview) return;
		setSelectedAlertIds((prev) => {
			if (prev.size === preview.alerts.length) return new Set();
			return new Set(preview.alerts.map((a) => a.id));
		});
		setEmptyConfirmed((v) => (v ? false : v));
	}, [preview]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!jwt || !selectedMonth) return;

		const [year, month] = selectedMonth.split("-").map(Number);
		if (!year || !month) return;

		try {
			setIsSubmitting(true);
			const notice = await createNotice({
				name,
				year,
				month,
				notes: notes || null,
				alertIds: Array.from(selectedAlertIds),
				jwt,
			});

			toast.success(
				`${notice.name} ha sido creado con ${notice.recordCount} alertas`,
			);
			navigateTo(`/notices/${notice.id}`);
		} catch (error) {
			console.error("Error creating notice:", error);
			if (isUsageLimitError(error)) {
				showUsageLimitToast(error);
			} else {
				toast.error(extractErrorMessage(error), { id: "create-notice" });
			}
			setIsSubmitting(false);
		}
	};

	const selectedMonthData = useMemo(
		() =>
			selectedMonth
				? availableMonths.find((m) => `${m.year}-${m.month}` === selectedMonth)
				: null,
		[selectedMonth, availableMonths],
	);

	const periodInfo = useMemo(
		() =>
			selectedMonthData
				? calculateNoticePeriod(selectedMonthData.year, selectedMonthData.month)
				: null,
		[selectedMonthData],
	);

	if (isLoading || isJwtLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="min-w-0 space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={() => router.back()}>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div>
					<h1 className="text-2xl font-semibold flex items-center gap-2">
						<FileWarning className="h-6 w-6 text-primary" />
						{t("noticeNewTitle")}
					</h1>
					<p className="text-muted-foreground">{t("noticeNewSubtitle")}</p>
				</div>
			</div>

			<form
				onSubmit={handleSubmit}
				className="grid min-w-0 gap-6 @xl/main:grid-cols-[minmax(280px,380px)_1fr]"
			>
				<Card className="@xl/main:self-start">
					<CardHeader>
						<CardTitle className="text-lg">{t("noticeConfigTitle")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
							<div className="w-full space-y-2 sm:min-w-[180px] sm:flex-1">
								<Label htmlFor="month">{t("noticeSatPeriod")}</Label>
								<Select value={selectedMonth} onValueChange={handleMonthChange}>
									<SelectTrigger id="month">
										<SelectValue placeholder={t("noticePeriodPlaceholder")} />
									</SelectTrigger>
									<SelectContent>
										{availableMonths.map((m) => {
											const key = `${m.year}-${m.month}`;
											return (
												<SelectItem
													key={key}
													value={key}
													disabled={m.hasPendingNotice}
												>
													{m.displayName}
													{m.hasPendingNotice && " (aviso pendiente)"}
												</SelectItem>
											);
										})}
									</SelectContent>
								</Select>
								{periodInfo && (
									<p className="text-xs text-muted-foreground">
										{t("noticePeriodLabel")}
										{periodInfo.periodStart.toLocaleDateString("es-MX")}{" "}
										{t("noticePeriodTo")}
										{periodInfo.periodEnd.toLocaleDateString("es-MX")}
									</p>
								)}
							</div>

							<div className="w-full space-y-2 sm:min-w-[180px] sm:flex-1">
								<Label htmlFor="name">{t("noticeNameLabel")}</Label>
								<Input
									id="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder={t("noticeNamePlaceholder")}
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="notes">{t("noticeNotesLabel")}</Label>
							<Textarea
								id="notes"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder={t("noticeNotesPlaceholder")}
								rows={3}
							/>
						</div>
					</CardContent>
				</Card>

				<Card className="min-w-0">
					<CardHeader>
						<CardTitle className="text-lg">{t("noticePreview")}</CardTitle>
					</CardHeader>
					<CardContent className="min-w-0">
						{isPreviewLoading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : preview ? (
							<div className="min-w-0 space-y-4">
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div className="min-w-0 p-4 bg-muted/50 rounded-lg">
										<p className="text-2xl font-bold">{preview.total}</p>
										<p className="text-sm text-muted-foreground">
											{t("noticeAvailableAlerts")}
										</p>
									</div>
									<div className="min-w-0 p-4 bg-muted/50 rounded-lg">
										<p className="text-sm font-medium">{preview.displayName}</p>
										<p className="text-xs text-muted-foreground">
											{preview.reportedMonth}
										</p>
									</div>
								</div>

								{preview.total > 0 ? (
									<>
										<div className="space-y-2">
											<p className="text-sm font-medium">
												{t("noticeBySeverity")}
											</p>
											<div className="flex flex-wrap gap-2">
												{Object.entries(preview.bySeverity).map(
													([severity, count]) => (
														<span
															key={severity}
															className={`px-2 py-1 rounded text-xs font-medium ${
																severity === "CRITICAL"
																	? "bg-red-500/20 text-red-400"
																	: severity === "HIGH"
																		? "bg-orange-500/20 text-orange-400"
																		: severity === "MEDIUM"
																			? "bg-amber-500/20 text-amber-400"
																			: "bg-gray-500/20 text-gray-400"
															}`}
														>
															{severity}: {count}
														</span>
													),
												)}
											</div>
										</div>

										<div className="flex items-center justify-between text-sm text-muted-foreground">
											<span>
												{selectedAlertIds.size} de {preview.alerts.length}{" "}
												alertas seleccionadas
											</span>
										</div>

										<div
											className="min-w-0 max-h-72 overflow-y-auto overflow-x-auto rounded-md border"
											role="region"
											aria-label={t("noticePreview")}
										>
											<Table>
												<TableCaption className="sr-only">
													Alertas del aviso
												</TableCaption>
												<TableHeader>
													<TableRow>
														<TableHead
															className="w-10 cursor-pointer"
															onClick={toggleAll}
														>
															<Checkbox
																checked={
																	selectedAlertIds.size ===
																	preview.alerts.length
																		? true
																		: selectedAlertIds.size > 0
																			? "indeterminate"
																			: false
																}
																className="pointer-events-none"
																tabIndex={-1}
																aria-label="Seleccionar todas"
															/>
														</TableHead>
														<TableHead>Cliente</TableHead>
														<TableHead>Regla</TableHead>
														<TableHead>Severidad</TableHead>
														<TableHead>Actividad</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{preview.alerts.map((alert) => (
														<TableRow
															key={alert.id}
															className="cursor-pointer"
															onClick={() => toggleAlert(alert.id)}
															data-state={
																selectedAlertIds.has(alert.id)
																	? "selected"
																	: undefined
															}
														>
															<TableCell>
																<Checkbox
																	checked={selectedAlertIds.has(alert.id)}
																	className="pointer-events-none"
																	tabIndex={-1}
																	aria-hidden
																/>
															</TableCell>
															<TableCell className="font-medium">
																{alert.clientName}
															</TableCell>
															<TableCell className="min-w-32 whitespace-normal text-xs">
																{alert.alertRuleName}
															</TableCell>
															<TableCell>
																<Badge
																	variant={
																		alert.severity === "CRITICAL" ||
																		alert.severity === "HIGH"
																			? "destructive"
																			: "secondary"
																	}
																	className="text-[10px]"
																>
																	{alert.severity}
																</Badge>
															</TableCell>
															<TableCell className="min-w-32 whitespace-normal text-xs text-muted-foreground">
																{alert.activityCode ?? "—"}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>

										<div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
											<div className="flex items-center gap-2 text-amber-600">
												<Clock className="h-4 w-4" />
												<p className="text-sm font-medium">
													{t("noticeSubmissionDeadline")}
												</p>
											</div>
											<p className="text-sm text-amber-600/80 mt-1">
												{new Date(
													preview.submissionDeadline,
												).toLocaleDateString("es-MX", {
													weekday: "long",
													year: "numeric",
													month: "long",
													day: "numeric",
												})}
											</p>
										</div>

										{selectedAlertIds.size === 0 && (
											<div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-lg space-y-3">
												<div className="flex items-start gap-2 text-amber-600">
													<AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
													<div>
														<p className="text-sm font-semibold">
															Aviso sin alertas seleccionadas
														</p>
														<p className="text-xs mt-1 text-amber-600/80">
															De acuerdo con la LFPIORPI, omitir operaciones
															vulnerables detectadas en un aviso puede derivar
															en sanciones administrativas y económicas. Solo
															proceda si está seguro de que estas alertas no
															corresponden a operaciones reportables.
														</p>
													</div>
												</div>
												<div
													className="flex items-center gap-2 cursor-pointer"
													onClick={() => setEmptyConfirmed((v) => !v)}
													onKeyDown={(e) => {
														if (e.key === " " || e.key === "Enter") {
															e.preventDefault();
															setEmptyConfirmed((v) => !v);
														}
													}}
													role="checkbox"
													aria-checked={emptyConfirmed}
													tabIndex={0}
												>
													<Checkbox
														checked={emptyConfirmed}
														className="pointer-events-none"
														tabIndex={-1}
													/>
													<span className="text-xs text-amber-700">
														Confirmo que deseo crear el aviso sin alertas
													</span>
												</div>
											</div>
										)}

										{selectedAlertIds.size > 0 &&
											selectedAlertIds.size < preview.alerts.length && (
												<div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
													<div className="flex items-start gap-2 text-blue-600">
														<Info className="h-4 w-4 mt-0.5 shrink-0" />
														<p className="text-xs">
															{preview.alerts.length - selectedAlertIds.size}{" "}
															alerta(s) no serán incluidas en este aviso. Podrá
															agregarlas posteriormente si es necesario.
														</p>
													</div>
												</div>
											)}
									</>
								) : (
									<div className="p-4 bg-muted/50 border border-border rounded-lg">
										<div className="flex items-start gap-3">
											<Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
											<div>
												<p className="text-sm font-medium">
													Sin actividad vulnerable
												</p>
												<p className="text-xs text-muted-foreground mt-1">
													No se detectaron operaciones vulnerables en este
													periodo. Se creará un aviso informativo sin actividad.
												</p>
											</div>
										</div>
									</div>
								)}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<Calendar className="h-8 w-8 text-muted-foreground mb-2" />
								<p className="text-sm text-muted-foreground">
									{t("noticeSelectPeriodPreview")}
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				<div className="@xl/main:col-span-2 flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigateTo("/notices")}
					>
						{t("cancel")}
					</Button>
					<Button
						type="submit"
						loading={isSubmitting}
						disabled={
							!selectedMonth ||
							!name ||
							!preview ||
							(preview.total > 0 &&
								selectedAlertIds.size === 0 &&
								!emptyConfirmed)
						}
					>
						{t("noticeCreateButton")}
					</Button>
				</div>
			</form>
		</div>
	);
}

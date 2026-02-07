"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	FileWarning,
	Calendar,
	ArrowLeft,
	Loader2,
	AlertCircle,
	CheckCircle2,
	Clock,
	CircleDashed,
} from "lucide-react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useJwt } from "@/hooks/useJwt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/mutations";
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
	const { navigateTo, orgPath } = useOrgNavigation();
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

	// Load preview when month changes
	useEffect(() => {
		if (!jwt || !selectedMonth) {
			setPreview(null);
			return;
		}

		const [year, month] = selectedMonth.split("-").map(Number);
		if (!year || !month) return;

		const loadPreview = async () => {
			try {
				setIsPreviewLoading(true);
				const response = await previewNotice({ year, month, jwt });
				setPreview(response);
			} catch (error) {
				console.error("Error loading preview:", error);
				setPreview(null);
			} finally {
				setIsPreviewLoading(false);
			}
		};

		loadPreview();
	}, [jwt, selectedMonth]);

	const handleMonthChange = (value: string) => {
		setSelectedMonth(value);
		const month = availableMonths.find((m) => `${m.year}-${m.month}` === value);
		if (month) {
			setName(`Aviso ${month.displayName}`);
		}
	};

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
				jwt,
			});

			toast.success(
				`${notice.name} ha sido creado con ${notice.recordCount} alertas`,
			);
			navigateTo(`/notices/${notice.id}`);
		} catch (error) {
			console.error("Error creating notice:", error);
			toast.error(extractErrorMessage(error), { id: "create-notice" });
		} finally {
			setIsSubmitting(false);
		}
	};

	const selectedMonthData = selectedMonth
		? availableMonths.find((m) => `${m.year}-${m.month}` === selectedMonth)
		: null;

	const periodInfo = selectedMonthData
		? calculateNoticePeriod(selectedMonthData.year, selectedMonthData.month)
		: null;

	if (isLoading || isJwtLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
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

			<form onSubmit={handleSubmit} className="grid gap-6 @xl/main:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">{t("noticeConfigTitle")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="month">{t("noticeSatPeriod")}</Label>
							<Select value={selectedMonth} onValueChange={handleMonthChange}>
								<SelectTrigger id="month">
									<SelectValue placeholder={t("noticeSelectPeriod")} />
								</SelectTrigger>
								<SelectContent>
									{availableMonths.map((month) => (
										<SelectItem
											key={`${month.year}-${month.month}`}
											value={`${month.year}-${month.month}`}
											disabled={month.hasPendingNotice}
										>
											<div className="flex items-center gap-2">
												{month.hasPendingNotice && (
													<CircleDashed className="h-3.5 w-3.5 text-amber-500" />
												)}
												{!month.hasPendingNotice &&
													month.hasSubmittedNotice && (
														<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
													)}
												<span>{month.displayName}</span>
												{month.hasPendingNotice && (
													<span className="text-xs text-muted-foreground">
														{t("noticeInProgress")}
													</span>
												)}
												{!month.hasPendingNotice &&
													month.hasSubmittedNotice && (
														<span className="text-xs text-muted-foreground">
															({month.noticeCount}{" "}
															{month.noticeCount === 1
																? t("noticeSentSuffix")
																: t("noticeSentSuffixPlural")}
															)
														</span>
													)}
											</div>
										</SelectItem>
									))}
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

						<div className="space-y-2">
							<Label htmlFor="name">{t("noticeNameLabel")}</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={t("noticeNamePlaceholder")}
								required
							/>
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

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">{t("noticePreview")}</CardTitle>
					</CardHeader>
					<CardContent>
						{isPreviewLoading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : preview ? (
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="p-4 bg-muted/50 rounded-lg">
										<p className="text-2xl font-bold">{preview.total}</p>
										<p className="text-sm text-muted-foreground">
											{t("noticeAvailableAlerts")}
										</p>
									</div>
									<div className="p-4 bg-muted/50 rounded-lg">
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
									</>
								) : (
									<div className="flex flex-col items-center justify-center py-8 text-center">
										<AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
										<p className="text-sm text-muted-foreground">
											{t("noticeNoAlerts")}
										</p>
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

				<div className="lg:col-span-2 flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigateTo("/notices")}
					>
						{t("cancel")}
					</Button>
					<Button
						type="submit"
						disabled={
							isSubmitting ||
							!selectedMonth ||
							!name ||
							(preview?.total ?? 0) === 0
						}
					>
						{isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
						{t("noticeCreateButton")}
					</Button>
				</div>
			</form>
		</div>
	);
}

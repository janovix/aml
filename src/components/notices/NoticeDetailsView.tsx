"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	FileWarning,
	Calendar,
	ArrowLeft,
	Loader2,
	AlertCircle,
	FileCheck2,
	Send,
	CheckCircle2,
	Clock,
	Download,
	Trash2,
} from "lucide-react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useJwt } from "@/hooks/useJwt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/mutations";
import { showFetchError } from "@/lib/toast-utils";
import { useLanguage } from "@/components/LanguageProvider";
import {
	getNoticeById,
	generateNoticeFile,
	downloadNoticeXml,
	submitNoticeToSat,
	acknowledgeNotice,
	deleteNotice,
	type NoticeWithAlertSummary,
	type NoticeStatus,
} from "@/lib/api/notices";

interface NoticeDetailsViewProps {
	noticeId: string;
}

export function NoticeDetailsView({
	noticeId,
}: NoticeDetailsViewProps): React.ReactElement {
	const router = useRouter();
	const { navigateTo } = useOrgNavigation();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { t } = useLanguage();

	const statusConfig: Record<
		NoticeStatus,
		{ label: string; icon: React.ReactNode; color: string; bgColor: string }
	> = {
		DRAFT: {
			label: t("statusDraft"),
			icon: <Clock className="h-4 w-4" />,
			color: "text-zinc-400",
			bgColor: "bg-zinc-500/20",
		},
		GENERATED: {
			label: t("statusGenerated"),
			icon: <FileCheck2 className="h-4 w-4" />,
			color: "text-blue-400",
			bgColor: "bg-blue-500/20",
		},
		SUBMITTED: {
			label: t("statusSubmitted"),
			icon: <Send className="h-4 w-4" />,
			color: "text-amber-400",
			bgColor: "bg-amber-500/20",
		},
		ACKNOWLEDGED: {
			label: t("statusAcknowledged"),
			icon: <CheckCircle2 className="h-4 w-4" />,
			color: "text-emerald-400",
			bgColor: "bg-emerald-500/20",
		},
	};

	const [notice, setNotice] = useState<NoticeWithAlertSummary | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isAcknowledging, setIsAcknowledging] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const [showSubmitDialog, setShowSubmitDialog] = useState(false);
	const [showAcknowledgeDialog, setShowAcknowledgeDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [satFolioNumber, setSatFolioNumber] = useState("");

	const loadNotice = async () => {
		if (!jwt) return;
		try {
			setIsLoading(true);
			const data = await getNoticeById({ id: noticeId, jwt });
			setNotice(data);
		} catch (error) {
			console.error("Error loading notice:", error);
			showFetchError("notice-details", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (!jwt || isJwtLoading) return;
		loadNotice();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [jwt, isJwtLoading, noticeId]);

	const handleGenerate = async () => {
		if (!jwt || !notice) return;
		try {
			setIsGenerating(true);
			await generateNoticeFile({ id: notice.id, jwt });
			toast.success(t("noticeXmlGenerated"));
			loadNotice();
		} catch (error) {
			console.error("Error generating notice:", error);
			toast.error(extractErrorMessage(error), { id: "notice-download" });
		} finally {
			setIsGenerating(false);
		}
	};

	const handleDownload = async () => {
		if (!jwt || !notice) return;
		try {
			await downloadNoticeXml({ id: notice.id, jwt });
		} catch (error) {
			console.error("Error downloading notice:", error);
			toast.error(extractErrorMessage(error), { id: "notice-download" });
		}
	};

	const handleSubmit = async () => {
		if (!jwt || !notice) return;
		try {
			setIsSubmitting(true);
			await submitNoticeToSat({
				id: notice.id,
				satFolioNumber: satFolioNumber || undefined,
				jwt,
			});
			toast.success(t("noticeMarkedSubmitted"));
			setShowSubmitDialog(false);
			setSatFolioNumber("");
			loadNotice();
		} catch (error) {
			console.error("Error submitting notice:", error);
			toast.error(extractErrorMessage(error), { id: "notice-submit" });
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleAcknowledge = async () => {
		if (!jwt || !notice || !satFolioNumber) return;
		try {
			setIsAcknowledging(true);
			await acknowledgeNotice({
				id: notice.id,
				satFolioNumber,
				jwt,
			});
			toast.success(t("noticeAckRegistered"));
			setShowAcknowledgeDialog(false);
			setSatFolioNumber("");
			loadNotice();
		} catch (error) {
			console.error("Error acknowledging notice:", error);
			toast.error(extractErrorMessage(error), { id: "notice-validate" });
		} finally {
			setIsAcknowledging(false);
		}
	};

	const handleDelete = async () => {
		if (!jwt || !notice) return;
		try {
			setIsDeleting(true);
			await deleteNotice({ id: notice.id, jwt });
			toast.success(t("noticeDeleted"));
			navigateTo("/notices");
		} catch (error) {
			console.error("Error deleting notice:", error);
			toast.error(extractErrorMessage(error), { id: "notice-delete" });
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	};

	if (isLoading || isJwtLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!notice) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-medium">{t("noticeNotFound")}</h3>
				<p className="text-muted-foreground mb-4">{t("noticeNotFoundDesc")}</p>
				<Button onClick={() => navigateTo("/notices")}>
					{t("noticeBackToNotices")}
				</Button>
			</div>
		);
	}

	const statusCfg = statusConfig[notice.status];
	const periodStart = new Date(notice.periodStart);
	const periodEnd = new Date(notice.periodEnd);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => router.back()}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-semibold">{notice.name}</h1>
							<span
								className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusCfg.bgColor} ${statusCfg.color}`}
							>
								{statusCfg.icon}
								{statusCfg.label}
							</span>
						</div>
						<p className="text-muted-foreground">ID: {notice.id}</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{notice.status === "DRAFT" && (
						<>
							<Button
								variant="outline"
								className="text-destructive"
								onClick={() => setShowDeleteDialog(true)}
							>
								<Trash2 className="h-4 w-4 mr-2" />
								{t("noticeDelete")}
							</Button>
							<Button onClick={handleGenerate} disabled={isGenerating}>
								{isGenerating ? (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								) : (
									<FileCheck2 className="h-4 w-4 mr-2" />
								)}
								{t("noticeGenerateXml")}
							</Button>
						</>
					)}
					{notice.status === "GENERATED" && (
						<>
							<Button variant="outline" onClick={handleDownload}>
								<Download className="h-4 w-4 mr-2" />
								{t("noticeDownloadXml")}
							</Button>
							<Button onClick={() => setShowSubmitDialog(true)}>
								<Send className="h-4 w-4 mr-2" />
								{t("noticeMarkSubmitted")}
							</Button>
						</>
					)}
					{notice.status === "SUBMITTED" && (
						<>
							<Button variant="outline" onClick={handleDownload}>
								<Download className="h-4 w-4 mr-2" />
								{t("noticeDownloadXml")}
							</Button>
							<Button onClick={() => setShowAcknowledgeDialog(true)}>
								<CheckCircle2 className="h-4 w-4 mr-2" />
								{t("noticeRegisterAcknowledgement")}
							</Button>
						</>
					)}
					{notice.status === "ACKNOWLEDGED" && (
						<Button variant="outline" onClick={handleDownload}>
							<Download className="h-4 w-4 mr-2" />
							{t("noticeDownloadXml")}
						</Button>
					)}
				</div>
			</div>

			<div className="grid gap-6 @xl/main:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<Calendar className="h-5 w-5" />
							{t("noticePeriodInfo")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-muted-foreground">
									{t("noticePeriod")}
								</p>
								<p className="font-medium">{notice.reportedMonth}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">
									{t("noticeAlerts")}
								</p>
								<p className="font-medium">{notice.recordCount}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">
									{t("noticePeriodStart")}
								</p>
								<p className="font-medium">
									{periodStart.toLocaleDateString("es-MX", {
										day: "2-digit",
										month: "long",
										year: "numeric",
									})}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">
									{t("noticePeriodEnd")}
								</p>
								<p className="font-medium">
									{periodEnd.toLocaleDateString("es-MX", {
										day: "2-digit",
										month: "long",
										year: "numeric",
									})}
								</p>
							</div>
						</div>

						{notice.satFolioNumber && (
							<div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
								<p className="text-sm text-muted-foreground">
									{t("noticeSatFolio")}
								</p>
								<p className="font-medium text-emerald-600">
									{notice.satFolioNumber}
								</p>
							</div>
						)}

						{notice.submittedAt && (
							<div>
								<p className="text-sm text-muted-foreground">
									{t("noticeSubmissionDate")}
								</p>
								<p className="font-medium">
									{new Date(notice.submittedAt).toLocaleDateString("es-MX", {
										day: "2-digit",
										month: "long",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<FileWarning className="h-5 w-5" />
							{t("noticeAlertsSummary")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="text-3xl font-bold">
							{notice.alertSummary.total} alertas
						</div>

						<div className="space-y-3">
							<div>
								<p className="text-sm font-medium mb-2">
									{t("noticeBySeverity")}
								</p>
								<div className="flex flex-wrap gap-2">
									{Object.entries(notice.alertSummary.bySeverity).map(
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

							<div>
								<p className="text-sm font-medium mb-2">
									{t("noticeByStatus")}
								</p>
								<div className="flex flex-wrap gap-2">
									{Object.entries(notice.alertSummary.byStatus).map(
										([status, count]) => (
											<span
												key={status}
												className="px-2 py-1 rounded text-xs font-medium bg-muted"
											>
												{status}: {count}
											</span>
										),
									)}
								</div>
							</div>

							{notice.alertSummary.byRule.length > 0 && (
								<div>
									<p className="text-sm font-medium mb-2">
										{t("noticeByRule")}
									</p>
									<div className="space-y-1">
										{notice.alertSummary.byRule.slice(0, 5).map((rule) => (
											<div
												key={rule.ruleId}
												className="flex justify-between text-sm"
											>
												<span className="text-muted-foreground">
													{rule.ruleName}
												</span>
												<span className="font-medium">{rule.count}</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Submit Dialog */}
			<Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("noticeMarkSubmittedTitle")}</DialogTitle>
						<DialogDescription>
							{t("noticeMarkSubmittedDesc")}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="folioSubmit">{t("noticeFolioOptional")}</Label>
							<Input
								id="folioSubmit"
								value={satFolioNumber}
								onChange={(e) => setSatFolioNumber(e.target.value)}
								placeholder={t("noticeFolioPlaceholder")}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowSubmitDialog(false)}
						>
							{t("cancel")}
						</Button>
						<Button onClick={handleSubmit} disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							)}
							{t("noticeConfirmSubmission")}
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
						<DialogTitle>{t("noticeRegisterAckTitle")}</DialogTitle>
						<DialogDescription>{t("noticeRegisterAckDesc")}</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="folioAck">{t("noticeFolioRequired")}</Label>
							<Input
								id="folioAck"
								value={satFolioNumber}
								onChange={(e) => setSatFolioNumber(e.target.value)}
								placeholder={t("noticeFolioAckPlaceholder")}
								required
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowAcknowledgeDialog(false)}
						>
							{t("cancel")}
						</Button>
						<Button
							onClick={handleAcknowledge}
							disabled={isAcknowledging || !satFolioNumber}
						>
							{isAcknowledging && (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							)}
							{t("noticeRegisterAcknowledgement")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("noticeDeleteTitle")}</DialogTitle>
						<DialogDescription>{t("noticeDeleteDesc")}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDeleteDialog(false)}
						>
							{t("cancel")}
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isDeleting}
						>
							{isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
							{t("delete")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

"use client";

import { useState, useEffect, useRef } from "react";
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
	Upload,
	XCircle,
	RotateCcw,
	AlertTriangle,
	FileText,
	History,
	Plus,
} from "lucide-react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useOrgStore } from "@/lib/org-store";
import { useJwt } from "@/hooks/useJwt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
	rebukeNotice,
	revertNoticeToDraft,
	removeAlertsFromNotice,
	deleteNotice,
	type NoticeWithAlertSummary,
	type NoticeStatus,
	type NoticeEventType,
} from "@/lib/api/notices";
import {
	uploadPdfDocument,
	getDocumentDisplayUrls,
} from "@/lib/api/file-upload";
import { cn } from "@/lib/utils";

interface NoticeDetailsViewProps {
	noticeId: string;
}

export function NoticeDetailsSkeleton(): React.ReactElement {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Skeleton className="h-10 w-10 rounded-md shrink-0" />
					<div className="space-y-2">
						<div className="flex items-center gap-3">
							<Skeleton className="h-8 w-48" />
							<Skeleton className="h-6 w-24 rounded-full" />
						</div>
						<Skeleton className="h-4 w-40" />
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Skeleton className="h-9 w-24 rounded-md" />
					<Skeleton className="h-9 w-32 rounded-md" />
				</div>
			</div>

			<div className="grid gap-6 @xl/main:grid-cols-2">
				{[1, 2].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-40" />
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-4">
								{[1, 2, 3, 4].map((j) => (
									<div key={j} className="space-y-1.5">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-5 w-32" />
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
				</CardHeader>
				<CardContent className="space-y-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-12 w-full" />
					))}
				</CardContent>
			</Card>
		</div>
	);
}

const EVENT_TYPE_CONFIG: Record<
	NoticeEventType,
	{ label: string; color: string }
> = {
	CREATED: { label: "Aviso creado", color: "text-zinc-400" },
	GENERATED: { label: "XML generado", color: "text-blue-400" },
	SUBMITTED: { label: "Enviado al SAT", color: "text-amber-400" },
	ACKNOWLEDGED: { label: "Acuse registrado", color: "text-emerald-400" },
	REBUKED: { label: "Rechazado por SAT", color: "text-red-400" },
	REVERTED: { label: "Revertido a borrador", color: "text-zinc-400" },
	ALERTS_MODIFIED: { label: "Alertas modificadas", color: "text-blue-400" },
};

function EventTypeIcon({
	eventType,
	className,
}: {
	eventType: NoticeEventType;
	className?: string;
}) {
	const props = { className: cn("h-4 w-4", className) };
	switch (eventType) {
		case "CREATED":
			return <Clock {...props} />;
		case "GENERATED":
			return <FileCheck2 {...props} />;
		case "SUBMITTED":
			return <Send {...props} />;
		case "ACKNOWLEDGED":
			return <CheckCircle2 {...props} />;
		case "REBUKED":
			return <XCircle {...props} />;
		case "REVERTED":
			return <RotateCcw {...props} />;
		case "ALERTS_MODIFIED":
			return <AlertCircle {...props} />;
	}
}

export function NoticeDetailsView({
	noticeId,
}: NoticeDetailsViewProps): React.ReactElement {
	const router = useRouter();
	const { navigateTo } = useOrgNavigation();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { t } = useLanguage();
	const { currentOrg, currentUserId } = useOrgStore();
	const submitFileInputRef = useRef<HTMLInputElement>(null);
	const ackFileInputRef = useRef<HTMLInputElement>(null);
	const rebukeFileInputRef = useRef<HTMLInputElement>(null);

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
		REBUKED: {
			label: "Rechazado",
			icon: <XCircle className="h-4 w-4" />,
			color: "text-red-400",
			bgColor: "bg-red-500/20",
		},
	};

	const [notice, setNotice] = useState<NoticeWithAlertSummary | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isAcknowledging, setIsAcknowledging] = useState(false);
	const [isRebuking, setIsRebuking] = useState(false);
	const [isReverting, setIsReverting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [removingAlertId, setRemovingAlertId] = useState<string | null>(null);

	const [showSubmitDialog, setShowSubmitDialog] = useState(false);
	const [showAcknowledgeDialog, setShowAcknowledgeDialog] = useState(false);
	const [showRebukeDialog, setShowRebukeDialog] = useState(false);
	const [showRevertDialog, setShowRevertDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [submitPdfFile, setSubmitPdfFile] = useState<File | null>(null);
	const [ackPdfFile, setAckPdfFile] = useState<File | null>(null);
	const [rebukePdfFile, setRebukePdfFile] = useState<File | null>(null);
	const [rebukeNotes, setRebukeNotes] = useState("");

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
		if (!jwt || !notice || !submitPdfFile || !currentOrg?.id || !currentUserId)
			return;
		try {
			setIsSubmitting(true);
			const { documentId } = await uploadPdfDocument({
				organizationId: currentOrg.id,
				userId: currentUserId,
				pdfFile: submitPdfFile,
				onProgress: (stage) =>
					toast.loading(stage, { id: "notice-submit-upload" }),
			});
			toast.dismiss("notice-submit-upload");
			await submitNoticeToSat({
				id: notice.id,
				docSvcDocumentId: documentId,
				jwt,
			});
			toast.success(t("noticeMarkedSubmitted"));
			setShowSubmitDialog(false);
			setSubmitPdfFile(null);
			loadNotice();
		} catch (error) {
			toast.dismiss("notice-submit-upload");
			console.error("Error submitting notice:", error);
			toast.error(extractErrorMessage(error), { id: "notice-submit" });
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleAcknowledge = async () => {
		if (!jwt || !notice || !ackPdfFile || !currentOrg?.id || !currentUserId)
			return;
		try {
			setIsAcknowledging(true);
			const { documentId } = await uploadPdfDocument({
				organizationId: currentOrg.id,
				userId: currentUserId,
				pdfFile: ackPdfFile,
				onProgress: (stage) =>
					toast.loading(stage, { id: "notice-ack-upload" }),
			});
			toast.dismiss("notice-ack-upload");
			await acknowledgeNotice({
				id: notice.id,
				docSvcDocumentId: documentId,
				jwt,
			});
			toast.success(t("noticeAckRegistered"));
			setShowAcknowledgeDialog(false);
			setAckPdfFile(null);
			loadNotice();
		} catch (error) {
			toast.dismiss("notice-ack-upload");
			console.error("Error acknowledging notice:", error);
			toast.error(extractErrorMessage(error), { id: "notice-validate" });
		} finally {
			setIsAcknowledging(false);
		}
	};

	const handleRebuke = async () => {
		if (!jwt || !notice || !rebukePdfFile || !currentOrg?.id || !currentUserId)
			return;
		try {
			setIsRebuking(true);
			const { documentId } = await uploadPdfDocument({
				organizationId: currentOrg.id,
				userId: currentUserId,
				pdfFile: rebukePdfFile,
				onProgress: (stage) =>
					toast.loading(stage, { id: "notice-rebuke-upload" }),
			});
			toast.dismiss("notice-rebuke-upload");
			await rebukeNotice({
				id: notice.id,
				docSvcDocumentId: documentId,
				notes: rebukeNotes || undefined,
				jwt,
			});
			toast.success("Rechazo registrado");
			setShowRebukeDialog(false);
			setRebukePdfFile(null);
			setRebukeNotes("");
			loadNotice();
		} catch (error) {
			toast.dismiss("notice-rebuke-upload");
			console.error("Error rebuking notice:", error);
			toast.error(extractErrorMessage(error), { id: "notice-rebuke" });
		} finally {
			setIsRebuking(false);
		}
	};

	const handleRevert = async () => {
		if (!jwt || !notice) return;
		try {
			setIsReverting(true);
			await revertNoticeToDraft({ id: notice.id, jwt });
			toast.success("Aviso revertido a borrador");
			setShowRevertDialog(false);
			loadNotice();
		} catch (error) {
			console.error("Error reverting notice:", error);
			toast.error(extractErrorMessage(error), { id: "notice-revert" });
		} finally {
			setIsReverting(false);
		}
	};

	const handleRemoveAlert = async (alertId: string) => {
		if (!jwt || !notice) return;
		try {
			setRemovingAlertId(alertId);
			await removeAlertsFromNotice({
				id: notice.id,
				alertIds: [alertId],
				jwt,
			});
			toast.success("Alerta removida del aviso");
			loadNotice();
		} catch (error) {
			console.error("Error removing alert:", error);
			toast.error(extractErrorMessage(error), { id: "notice-remove-alert" });
		} finally {
			setRemovingAlertId(null);
		}
	};

	const handleViewEventPdf = async (pdfDocumentId: string) => {
		if (!currentOrg?.id) return;
		try {
			const urls = await getDocumentDisplayUrls(
				currentOrg.id,
				pdfDocumentId,
				"pdf",
			);
			if (urls.pdfUrl) {
				window.open(urls.pdfUrl, "_blank");
			} else {
				toast.error("PDF no disponible");
			}
		} catch (error) {
			console.error("Error fetching PDF URL:", error);
			toast.error("No se pudo obtener el PDF");
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
		return <NoticeDetailsSkeleton />;
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

	const latestRebukedEvent = notice.events
		.filter((e) => e.eventType === "REBUKED")
		.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		)[0];

	const sortedEvents = [...notice.events].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => router.back()}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<div className="flex items-center gap-3 flex-wrap">
							<h1 className="text-2xl font-semibold">{notice.name}</h1>
							<span
								className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusCfg.bgColor} ${statusCfg.color}`}
							>
								{statusCfg.icon}
								{statusCfg.label}
							</span>
							{notice.amendmentCycle > 0 && (
								<Badge
									variant="outline"
									className="border-amber-500/50 text-amber-400"
								>
									Enmienda #{notice.amendmentCycle}
								</Badge>
							)}
							{notice.recordCount === 0 && (
								<Badge variant="secondary">Sin actividad</Badge>
							)}
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
							<Button
								variant="outline"
								className="text-destructive"
								onClick={() => setShowDeleteDialog(true)}
							>
								<Trash2 className="h-4 w-4 mr-2" />
								{t("noticeDelete")}
							</Button>
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
							<Button
								variant="outline"
								className="text-red-400 border-red-500/30 hover:bg-red-500/10"
								onClick={() => setShowRebukeDialog(true)}
							>
								<XCircle className="h-4 w-4 mr-2" />
								Reportar Rechazo
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
					{notice.status === "REBUKED" && (
						<>
							<Button variant="outline" onClick={handleDownload}>
								<Download className="h-4 w-4 mr-2" />
								{t("noticeDownloadXml")}
							</Button>
							<Button onClick={() => setShowRevertDialog(true)}>
								<RotateCcw className="h-4 w-4 mr-2" />
								Revertir a Borrador
							</Button>
						</>
					)}
				</div>
			</div>

			{/* Amendment guidance banner */}
			{notice.status === "DRAFT" && notice.amendmentCycle > 0 && (
				<div className="flex gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
					<AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
					<div className="space-y-2 text-sm">
						<p className="font-medium text-amber-300">
							SAT reportó un rechazo — revise el documento adjunto
						</p>
						{latestRebukedEvent?.notes && (
							<p className="text-muted-foreground italic">
								&ldquo;{latestRebukedEvent.notes}&rdquo;
							</p>
						)}
						<ol className="list-decimal list-inside space-y-1 text-muted-foreground">
							<li>
								Revise las observaciones del rechazo en el historial de eventos
							</li>
							<li>Modifique las alertas incluidas si es necesario</li>
							<li>Genere nuevamente el archivo XML</li>
							<li>Envíe al SAT</li>
						</ol>
					</div>
				</div>
			)}

			{/* Period + Summary cards */}
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

			{/* Alert management for DRAFT notices */}
			{notice.status === "DRAFT" && notice.alerts.length > 0 && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg flex items-center gap-2">
								<AlertCircle className="h-5 w-5" />
								Alertas incluidas ({notice.alerts.length})
							</CardTitle>
							<Button variant="outline" size="sm" disabled>
								<Plus className="h-4 w-4 mr-1" />
								Agregar Alertas
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{notice.alerts.map((alert) => (
								<div
									key={alert.id}
									className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/30"
								>
									<div className="flex items-center gap-3 min-w-0 flex-1">
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2 flex-wrap">
												<button
													type="button"
													className="text-sm font-medium text-primary hover:underline text-left truncate"
													onClick={() =>
														navigateTo(`/clients/${alert.clientId}`)
													}
												>
													{alert.clientName}
												</button>
												{alert.operationId && (
													<button
														type="button"
														className="text-xs text-muted-foreground hover:text-primary hover:underline"
														onClick={() =>
															navigateTo(`/operations/${alert.operationId}`)
														}
													>
														Op: {alert.operationId.slice(0, 8)}…
													</button>
												)}
											</div>
											<div className="flex items-center gap-2 mt-0.5">
												<span className="text-xs text-muted-foreground">
													{alert.alertRuleName}
												</span>
												<span
													className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
														alert.severity === "CRITICAL"
															? "bg-red-500/20 text-red-400"
															: alert.severity === "HIGH"
																? "bg-orange-500/20 text-orange-400"
																: alert.severity === "MEDIUM"
																	? "bg-amber-500/20 text-amber-400"
																	: "bg-gray-500/20 text-gray-400"
													}`}
												>
													{alert.severity}
												</span>
											</div>
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										className="text-destructive shrink-0"
										onClick={() => handleRemoveAlert(alert.id)}
										disabled={removingAlertId === alert.id}
									>
										{removingAlertId === alert.id ? (
											<Loader2 className="h-3 w-3 animate-spin" />
										) : (
											<Trash2 className="h-3 w-3 mr-1" />
										)}
										Remover
									</Button>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Event Timeline */}
			{sortedEvents.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<History className="h-5 w-5" />
							Historial
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="relative space-y-0">
							{sortedEvents.map((event, idx) => {
								const cfg = EVENT_TYPE_CONFIG[event.eventType];
								return (
									<div key={event.id} className="flex gap-3 relative">
										{idx < sortedEvents.length - 1 && (
											<div className="absolute left-[11px] top-8 bottom-0 w-px bg-border" />
										)}
										<div
											className={cn(
												"shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5",
												event.eventType === "REBUKED"
													? "bg-red-500/20"
													: event.eventType === "ACKNOWLEDGED"
														? "bg-emerald-500/20"
														: event.eventType === "SUBMITTED"
															? "bg-amber-500/20"
															: event.eventType === "GENERATED"
																? "bg-blue-500/20"
																: "bg-muted",
											)}
										>
											<EventTypeIcon
												eventType={event.eventType}
												className={cfg.color}
											/>
										</div>
										<div className="pb-5 min-w-0 flex-1">
											<div className="flex items-center gap-2 flex-wrap">
												<span className="text-sm font-medium">{cfg.label}</span>
												{event.cycle > 0 && (
													<Badge
														variant="outline"
														className="text-[10px] px-1.5 py-0"
													>
														Ciclo {event.cycle}
													</Badge>
												)}
												{event.pdfDocumentId && (
													<Button
														variant="ghost"
														size="sm"
														className="h-6 px-2 text-xs"
														onClick={() =>
															handleViewEventPdf(event.pdfDocumentId!)
														}
													>
														<FileText className="h-3 w-3 mr-1" />
														Ver PDF
													</Button>
												)}
											</div>
											<p className="text-xs text-muted-foreground mt-0.5">
												{new Date(event.createdAt).toLocaleDateString("es-MX", {
													day: "2-digit",
													month: "short",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
											{event.notes && (
												<p className="text-sm text-muted-foreground mt-1 italic">
													&ldquo;{event.notes}&rdquo;
												</p>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Submit Dialog */}
			<Dialog
				open={showSubmitDialog}
				onOpenChange={(open) => {
					setShowSubmitDialog(open);
					if (!open) {
						setSubmitPdfFile(null);
					}
				}}
			>
				<DialogContent fullscreenMobile>
					<DialogHeader>
						<DialogTitle>{t("noticeMarkSubmittedTitle")}</DialogTitle>
						<DialogDescription>
							{t("noticeMarkSubmittedDesc")}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>{t("noticePdfRequired")}</Label>
							<div
								className={cn(
									"border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors",
									submitPdfFile
										? "border-primary bg-primary/5"
										: "border-muted-foreground/25",
								)}
								onClick={() => submitFileInputRef.current?.click()}
							>
								{submitPdfFile ? (
									<div className="flex items-center justify-center gap-2 text-primary">
										<CheckCircle2 className="h-5 w-5" />
										<span className="text-sm font-medium">
											{submitPdfFile.name}
										</span>
									</div>
								) : (
									<div className="text-muted-foreground">
										<Upload className="h-6 w-6 mx-auto mb-1" />
										<p className="text-sm">{t("noticePdfUploadHint")}</p>
										<p className="text-xs mt-0.5">{t("noticePdfMaxSize")}</p>
									</div>
								)}
							</div>
							<input
								ref={submitFileInputRef}
								type="file"
								accept="application/pdf"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) {
										if (file.type !== "application/pdf") {
											toast.error(t("noticePdfOnlyError"));
											return;
										}
										if (file.size > 10 * 1024 * 1024) {
											toast.error(t("noticePdfMaxSizeError"));
											return;
										}
										setSubmitPdfFile(file);
									}
								}}
								className="hidden"
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
						<Button
							onClick={handleSubmit}
							disabled={isSubmitting || !submitPdfFile}
						>
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
				onOpenChange={(open) => {
					setShowAcknowledgeDialog(open);
					if (!open) {
						setAckPdfFile(null);
					}
				}}
			>
				<DialogContent fullscreenMobile>
					<DialogHeader>
						<DialogTitle>{t("noticeRegisterAckTitle")}</DialogTitle>
						<DialogDescription>{t("noticeRegisterAckDesc")}</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>{t("noticePdfRequired")}</Label>
							<div
								className={cn(
									"border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors",
									ackPdfFile
										? "border-primary bg-primary/5"
										: "border-muted-foreground/25",
								)}
								onClick={() => ackFileInputRef.current?.click()}
							>
								{ackPdfFile ? (
									<div className="flex items-center justify-center gap-2 text-primary">
										<CheckCircle2 className="h-5 w-5" />
										<span className="text-sm font-medium">
											{ackPdfFile.name}
										</span>
									</div>
								) : (
									<div className="text-muted-foreground">
										<Upload className="h-6 w-6 mx-auto mb-1" />
										<p className="text-sm">{t("noticePdfUploadHint")}</p>
										<p className="text-xs mt-0.5">{t("noticePdfMaxSize")}</p>
									</div>
								)}
							</div>
							<input
								ref={ackFileInputRef}
								type="file"
								accept="application/pdf"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) {
										if (file.type !== "application/pdf") {
											toast.error(t("noticePdfOnlyError"));
											return;
										}
										if (file.size > 10 * 1024 * 1024) {
											toast.error(t("noticePdfMaxSizeError"));
											return;
										}
										setAckPdfFile(file);
									}
								}}
								className="hidden"
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
							disabled={isAcknowledging || !ackPdfFile}
						>
							{isAcknowledging && (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							)}
							{t("noticeRegisterAcknowledgement")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Rebuke Dialog */}
			<Dialog
				open={showRebukeDialog}
				onOpenChange={(open) => {
					setShowRebukeDialog(open);
					if (!open) {
						setRebukePdfFile(null);
						setRebukeNotes("");
					}
				}}
			>
				<DialogContent fullscreenMobile>
					<DialogHeader>
						<DialogTitle>Reportar Rechazo del SAT</DialogTitle>
						<DialogDescription>
							Adjunte el oficio de rechazo del SAT y agregue notas si es
							necesario.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>PDF del oficio de rechazo *</Label>
							<div
								className={cn(
									"border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors",
									rebukePdfFile
										? "border-primary bg-primary/5"
										: "border-muted-foreground/25",
								)}
								onClick={() => rebukeFileInputRef.current?.click()}
							>
								{rebukePdfFile ? (
									<div className="flex items-center justify-center gap-2 text-primary">
										<CheckCircle2 className="h-5 w-5" />
										<span className="text-sm font-medium">
											{rebukePdfFile.name}
										</span>
									</div>
								) : (
									<div className="text-muted-foreground">
										<Upload className="h-6 w-6 mx-auto mb-1" />
										<p className="text-sm">{t("noticePdfUploadHint")}</p>
										<p className="text-xs mt-0.5">{t("noticePdfMaxSize")}</p>
									</div>
								)}
							</div>
							<input
								ref={rebukeFileInputRef}
								type="file"
								accept="application/pdf"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) {
										if (file.type !== "application/pdf") {
											toast.error(t("noticePdfOnlyError"));
											return;
										}
										if (file.size > 10 * 1024 * 1024) {
											toast.error(t("noticePdfMaxSizeError"));
											return;
										}
										setRebukePdfFile(file);
									}
								}}
								className="hidden"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="rebukeNotes">Notas (opcional)</Label>
							<Textarea
								id="rebukeNotes"
								value={rebukeNotes}
								onChange={(e) => setRebukeNotes(e.target.value)}
								placeholder="Observaciones del rechazo..."
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowRebukeDialog(false)}
						>
							{t("cancel")}
						</Button>
						<Button
							variant="destructive"
							onClick={handleRebuke}
							disabled={isRebuking || !rebukePdfFile}
						>
							{isRebuking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
							Confirmar Rechazo
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Revert Dialog */}
			<Dialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
				<DialogContent fullscreenMobile>
					<DialogHeader>
						<DialogTitle>Revertir a Borrador</DialogTitle>
						<DialogDescription>
							El aviso regresará al estado de borrador para que pueda ser
							modificado y re-enviado al SAT. ¿Desea continuar?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowRevertDialog(false)}
						>
							{t("cancel")}
						</Button>
						<Button onClick={handleRevert} disabled={isReverting}>
							{isReverting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
							Revertir a Borrador
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent fullscreenMobile>
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

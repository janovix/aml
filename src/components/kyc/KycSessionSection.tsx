"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Loader2,
	Plus,
	Mail,
	CheckCircle2,
	XCircle,
	RotateCcw,
	ChevronDown,
	ChevronRight,
	ExternalLink,
	Clock,
	Activity,
	AlertTriangle,
	ShieldCheck,
	Info,
	Settings,
} from "lucide-react";
import { toast } from "sonner";
import { useJwt } from "@/hooks/useJwt";
import { KycStatusBadge } from "./KycStatusBadge";
import {
	listKycSessions,
	createKycSession,
	approveKycSession,
	rejectKycSession,
	revokeKycSession,
	resendKycEmail,
	getKycSessionEvents,
	type KycSessionEntity,
	type KycSessionEventEntity,
} from "@/lib/api/kyc-sessions";
import { isSelfServiceDisabledError } from "@/lib/api/http";
import type { SelfServiceMode } from "@/lib/api/organization-settings";
import { getAuthAppUrl } from "@/lib/auth/config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<string, string> = {
	ALWAYS: "Identificación siempre requerida",
	ABOVE_THRESHOLD: "Por encima del umbral",
	BELOW_THRESHOLD: "Por debajo del umbral",
};

const TIER_BADGE_CLASS: Record<string, string> = {
	ALWAYS:
		"bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
	ABOVE_THRESHOLD:
		"bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
	BELOW_THRESHOLD:
		"bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const EVENT_LABELS: Record<string, string> = {
	session_created: "Sesión creada",
	session_accessed: "Sesión accedida",
	personal_info_updated: "Información personal actualizada",
	document_uploaded: "Documento cargado",
	shareholder_added: "Accionista agregado",
	shareholder_updated: "Accionista actualizado",
	beneficial_controller_added: "Beneficiario controlador agregado",
	beneficial_controller_updated: "Beneficiario controlador actualizado",
	address_added: "Dirección agregada",
	session_submitted: "Sesión enviada para revisión",
	session_approved: "Sesión aprobada",
	session_rejected: "Sesión rechazada",
	session_revoked: "Sesión revocada",
	email_sent: "Correo de invitación enviado",
};

const ACTOR_LABELS: Record<string, string> = {
	client: "Cliente",
	admin: "Administrador",
	system: "Sistema",
};

function formatDate(dateStr: string | null): string {
	if (!dateStr) return "—";
	try {
		return format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: es });
	} catch {
		return dateStr;
	}
}

function formatRelative(dateStr: string | null): string {
	if (!dateStr) return "—";
	try {
		return formatDistanceToNow(new Date(dateStr), {
			addSuffix: true,
			locale: es,
		});
	} catch {
		return dateStr;
	}
}

// ─── Event History ─────────────────────────────────────────────────────────────

interface EventHistoryProps {
	sessionId: string;
	jwt: string | null;
}

function EventHistory({ sessionId, jwt }: EventHistoryProps) {
	const [events, setEvents] = useState<KycSessionEventEntity[] | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			if (!jwt) return;
			try {
				const evts = await getKycSessionEvents({ id: sessionId, jwt });
				setEvents(evts);
			} catch {
				setEvents([]);
			} finally {
				setLoading(false);
			}
		}
		void load();
	}, [sessionId, jwt]);

	if (loading) {
		return (
			<div className="space-y-2 pt-2">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-8 w-full" />
				))}
			</div>
		);
	}

	if (!events?.length) {
		return (
			<p className="text-sm text-muted-foreground py-2">
				Sin eventos registrados.
			</p>
		);
	}

	return (
		<div className="divide-y pt-2 max-h-60 overflow-y-auto pr-1">
			{events.map((ev) => (
				<div
					key={ev.id}
					className="flex items-start gap-3 px-2 py-2.5 hover:bg-muted/50 transition-colors"
				>
					<Activity className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
					<div className="flex-1 min-w-0">
						<p className="text-xs font-medium">
							{EVENT_LABELS[ev.eventType] ?? ev.eventType}
						</p>
						<p className="text-[10px] text-muted-foreground">
							{ACTOR_LABELS[ev.actorType] ?? ev.actorType}
							{ev.actorIp ? ` · ${ev.actorIp}` : ""}
						</p>
					</div>
					<time className="text-[10px] text-muted-foreground shrink-0">
						{formatDate(ev.createdAt)}
					</time>
				</div>
			))}
		</div>
	);
}

// ─── Session Card ─────────────────────────────────────────────────────────────

interface SessionCardProps {
	session: KycSessionEntity;
	onAction: () => void;
	kycSelfServiceUrl: string | undefined;
}

function SessionCard({
	session,
	onAction,
	kycSelfServiceUrl,
}: SessionCardProps) {
	const { jwt } = useJwt();
	const [expanded, setExpanded] = useState(false);
	const [approving, setApproving] = useState(false);
	const [revoking, setRevoking] = useState(false);
	const [resending, setResending] = useState(false);
	const [showRejectDialog, setShowRejectDialog] = useState(false);
	const [rejectionReason, setRejectionReason] = useState("");
	const [reopenForCorrections, setReopenForCorrections] = useState(true);
	const [rejecting, setRejecting] = useState(false);

	const sessionUrl = kycSelfServiceUrl
		? `${kycSelfServiceUrl}/kyc/${session.token}`
		: null;

	const isReviewable =
		session.status === "SUBMITTED" || session.status === "PENDING_REVIEW";
	const isActive =
		session.status === "ACTIVE" || session.status === "IN_PROGRESS";
	const isTerminal =
		session.status === "APPROVED" ||
		session.status === "REJECTED" ||
		session.status === "EXPIRED" ||
		session.status === "REVOKED";

	async function handleApprove() {
		if (!jwt) return;
		setApproving(true);
		try {
			await approveKycSession({ id: session.id, jwt });
			toast.success("Sesión KYC aprobada correctamente");
			onAction();
		} catch {
			toast.error("Error al aprobar la sesión KYC");
		} finally {
			setApproving(false);
		}
	}

	async function handleReject() {
		if (!jwt || !rejectionReason.trim()) return;
		setRejecting(true);
		try {
			await rejectKycSession({
				id: session.id,
				input: {
					reason: rejectionReason.trim(),
					reopenForCorrections,
				},
				jwt,
			});
			toast.success(
				reopenForCorrections
					? "Sesión rechazada. El cliente puede realizar correcciones."
					: "Sesión rechazada.",
			);
			setShowRejectDialog(false);
			setRejectionReason("");
			onAction();
		} catch {
			toast.error("Error al rechazar la sesión KYC");
		} finally {
			setRejecting(false);
		}
	}

	async function handleRevoke() {
		if (!jwt) return;
		if (
			!window.confirm(
				"¿Estás seguro de que deseas revocar esta sesión KYC? Esta acción es irreversible.",
			)
		)
			return;
		setRevoking(true);
		try {
			await revokeKycSession({ id: session.id, jwt });
			toast.success("Sesión KYC revocada");
			onAction();
		} catch {
			toast.error("Error al revocar la sesión KYC");
		} finally {
			setRevoking(false);
		}
	}

	async function handleResendEmail() {
		if (!jwt) return;
		setResending(true);
		try {
			await resendKycEmail({ id: session.id, jwt });
			toast.success("Correo de invitación KYC reenviado");
			onAction();
		} catch {
			toast.error("Error al reenviar el correo KYC");
		} finally {
			setResending(false);
		}
	}

	return (
		<>
			<div
				className={cn(
					"bg-background divide-y",
					isReviewable && "bg-amber-50/50 dark:bg-amber-950/20",
					isActive && "bg-blue-50/30 dark:bg-blue-950/10",
					isTerminal && "opacity-70",
				)}
			>
				{/* Header row */}
				<div className="flex items-start justify-between gap-3 flex-wrap px-4 py-4">
					<div className="space-y-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<KycStatusBadge status={session.status} />
							{session.identificationTier && (
								<Badge
									variant="outline"
									className={cn(
										"text-xs",
										TIER_BADGE_CLASS[session.identificationTier],
									)}
								>
									{TIER_LABELS[session.identificationTier] ??
										session.identificationTier}
								</Badge>
							)}
						</div>
						<p className="text-xs text-muted-foreground font-mono truncate">
							{session.id}
						</p>
					</div>

					<div className="flex items-center gap-2 shrink-0 flex-wrap">
						{/* Open link */}
						{sessionUrl && !isTerminal && (
							<Button
								variant="ghost"
								size="sm"
								className="h-7 text-xs gap-1"
								asChild
							>
								<a href={sessionUrl} target="_blank" rel="noopener noreferrer">
									<ExternalLink className="h-3 w-3" />
									Ver portal
								</a>
							</Button>
						)}

						{/* Resend email */}
						{isActive && (
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs gap-1"
								disabled={resending}
								onClick={handleResendEmail}
							>
								{resending ? (
									<Loader2 className="h-3 w-3 animate-spin" />
								) : (
									<Mail className="h-3 w-3" />
								)}
								Reenviar correo
							</Button>
						)}

						{/* Compliance review actions (Art. 18-I) */}
						{isReviewable && (
							<>
								<Button
									size="sm"
									className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
									disabled={approving}
									onClick={handleApprove}
								>
									{approving ? (
										<Loader2 className="h-3 w-3 animate-spin" />
									) : (
										<CheckCircle2 className="h-3 w-3" />
									)}
									Aprobar
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="h-7 text-xs gap-1 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
									onClick={() => setShowRejectDialog(true)}
								>
									<XCircle className="h-3 w-3" />
									Rechazar
								</Button>
							</>
						)}

						{/* Revoke */}
						{!isTerminal && (
							<Button
								variant="ghost"
								size="sm"
								className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
								disabled={revoking}
								onClick={handleRevoke}
							>
								{revoking ? (
									<Loader2 className="h-3 w-3 animate-spin" />
								) : (
									<RotateCcw className="h-3 w-3" />
								)}
								Revocar
							</Button>
						)}
					</div>
				</div>

				{/* Compliance review notice */}
				{isReviewable && (
					<div className="flex items-start gap-2 border-amber-200 bg-amber-50 dark:bg-amber-900/30 px-4 py-3">
						<ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
						<div className="text-xs text-amber-700 dark:text-amber-300">
							<p className="font-medium">
								Requiere revisión del oficial de cumplimiento
							</p>
							<p className="text-amber-600/80 dark:text-amber-400/70">
								Art. 18-I LFPIORPI — La identificación debe ser verificada de
								manera directa antes de aprobar.
							</p>
						</div>
					</div>
				)}

				{/* Meta info */}
				<div className="grid grid-cols-2 @xl/main:grid-cols-4 gap-3 text-xs px-4 py-4">
					<div>
						<p className="text-muted-foreground">Creado</p>
						<p className="font-medium">{formatDate(session.createdAt)}</p>
					</div>
					<div>
						<p className="text-muted-foreground">Expira</p>
						<p
							className={cn(
								"font-medium",
								!isTerminal &&
									new Date(session.expiresAt) < new Date() &&
									"text-destructive",
							)}
						>
							{formatDate(session.expiresAt)}
						</p>
					</div>
					{session.submittedAt && (
						<div>
							<p className="text-muted-foreground">Enviado</p>
							<p className="font-medium">
								{formatRelative(session.submittedAt)}
							</p>
						</div>
					)}
					{session.reviewedAt && (
						<div>
							<p className="text-muted-foreground">Revisado</p>
							<p className="font-medium">{formatDate(session.reviewedAt)}</p>
						</div>
					)}
					{session.rejectionReason && (
						<div className="col-span-2">
							<p className="text-muted-foreground">Motivo de rechazo</p>
							<p className="font-medium text-destructive">
								{session.rejectionReason}
							</p>
						</div>
					)}
					{session.emailSentAt && (
						<div>
							<p className="text-muted-foreground">Correo enviado</p>
							<p className="font-medium">
								{formatRelative(session.emailSentAt)}
							</p>
						</div>
					)}
				</div>

				{/* Audit trail toggle */}
				<Collapsible
					open={expanded}
					onOpenChange={setExpanded}
					className="px-4 py-3"
				>
					<CollapsibleTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							{expanded ? (
								<ChevronDown className="h-3.5 w-3.5" />
							) : (
								<ChevronRight className="h-3.5 w-3.5" />
							)}
							<Activity className="h-3.5 w-3.5" />
							Bitácora de auditoría (Art. 18-IV)
						</button>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<EventHistory sessionId={session.id} jwt={jwt} />
					</CollapsibleContent>
				</Collapsible>
			</div>

			{/* Reject dialog */}
			<Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
				<DialogContent fullscreenMobile>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<XCircle className="h-5 w-5 text-destructive" />
							Rechazar sesión KYC
						</DialogTitle>
						<DialogDescription>
							Proporciona el motivo del rechazo. El cliente será notificado y
							podrás permitirle corregir su información si es necesario.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="rejection-reason">
								Motivo de rechazo <span className="text-destructive">*</span>
							</Label>
							<Textarea
								id="rejection-reason"
								placeholder="Ej. La fotografía del INE es ilegible. Por favor suba una imagen más clara."
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								rows={3}
							/>
						</div>

						<div className="flex items-start gap-3 rounded-md border p-3">
							<Switch
								id="reopen-corrections"
								checked={reopenForCorrections}
								onCheckedChange={setReopenForCorrections}
							/>
							<div className="space-y-1">
								<Label htmlFor="reopen-corrections" className="cursor-pointer">
									Permitir correcciones
								</Label>
								<p className="text-xs text-muted-foreground">
									Si se activa, la sesión regresa al estado{" "}
									<strong>Activo</strong> para que el cliente pueda corregir y
									reenviar su información. Si se desactiva, la sesión queda
									rechazada definitivamente.
								</p>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowRejectDialog(false)}
							disabled={rejecting}
						>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							onClick={handleReject}
							disabled={!rejectionReason.trim() || rejecting}
						>
							{rejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Rechazar sesión
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

// ─── Main Section ─────────────────────────────────────────────────────────────

const COMPLIANCE_SETTINGS_URL = () => `${getAuthAppUrl()}/settings/compliance`;

interface KycSessionSectionProps {
	clientId: string;
	clientEmail?: string | null;
	kycSelfServiceUrl?: string;
	/** When "disabled", creation is not allowed; show alert and CTA to compliance settings. */
	selfServiceMode?: SelfServiceMode;
}

export function KycSessionSection({
	clientId,
	clientEmail,
	kycSelfServiceUrl,
	selfServiceMode = "automatic",
}: KycSessionSectionProps) {
	const { jwt } = useJwt();
	const [sessions, setSessions] = useState<KycSessionEntity[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [createDisabledDueToSettings, setCreateDisabledDueToSettings] =
		useState(false);

	const canCreateKycLink =
		(selfServiceMode === "manual" || selfServiceMode === "automatic") &&
		!createDisabledDueToSettings;
	const showDisabledAlert =
		selfServiceMode === "disabled" || createDisabledDueToSettings;

	const loadSessions = useCallback(async () => {
		if (!jwt) return;
		try {
			const result = await listKycSessions({ clientId, jwt });
			setSessions(result.data);
		} catch {
			setSessions([]);
		} finally {
			setLoading(false);
		}
	}, [clientId, jwt]);

	useEffect(() => {
		void loadSessions();
	}, [loadSessions]);

	async function handleCreate() {
		if (!jwt) return;
		setCreating(true);
		setCreateDisabledDueToSettings(false);
		try {
			await createKycSession({
				input: {
					clientId,
					sendEmail: Boolean(clientEmail),
				},
				jwt,
			});
			toast.success(
				clientEmail
					? "Sesión KYC creada. Se envió un correo al cliente."
					: "Sesión KYC creada.",
			);
			await loadSessions();
		} catch (err) {
			if (isSelfServiceDisabledError(err)) {
				setCreateDisabledDueToSettings(true);
				toast.error(
					"No se puede crear el enlace. Activa KYC Autoservicio en configuración de cumplimiento.",
				);
			} else {
				toast.error("Error al crear la sesión KYC");
			}
		} finally {
			setCreating(false);
		}
	}

	if (loading) {
		return (
			<div className="space-y-3">
				{[1, 2].map((i) => (
					<Skeleton key={i} className="h-28 w-full rounded-lg" />
				))}
			</div>
		);
	}

	const activeSessions =
		sessions?.filter(
			(s) =>
				s.status !== "EXPIRED" &&
				s.status !== "REVOKED" &&
				s.status !== "APPROVED",
		) ?? [];

	const hasActiveOrPending = activeSessions.length > 0;
	const pendingReview =
		sessions?.filter(
			(s) => s.status === "SUBMITTED" || s.status === "PENDING_REVIEW",
		) ?? [];

	return (
		<div className="space-y-4">
			{/* Header with create button */}
			<div className="flex items-center justify-between gap-4">
				<div className="space-y-1">
					{pendingReview.length > 0 && (
						<div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
							<AlertTriangle className="h-4 w-4" />
							<span className="text-sm font-medium">
								{pendingReview.length} sesión
								{pendingReview.length !== 1 ? "es" : ""} pendiente
								{pendingReview.length !== 1 ? "s" : ""} de revisión
							</span>
						</div>
					)}
					{!pendingReview.length && sessions?.length === 0 && (
						<p className="text-sm text-muted-foreground">
							No hay sesiones KYC registradas para este cliente.
						</p>
					)}
				</div>

				<Button
					size="sm"
					variant="outline"
					disabled={!canCreateKycLink || creating || hasActiveOrPending}
					onClick={handleCreate}
					className="shrink-0"
				>
					{creating ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Plus className="mr-2 h-4 w-4" />
					)}
					{clientEmail ? "Crear y enviar enlace" : "Crear enlace KYC"}
				</Button>
			</div>

			{showDisabledAlert && (
				<Alert
					variant="default"
					className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
				>
					<AlertTriangle className="text-amber-600 dark:text-amber-400" />
					<AlertTitle className="text-amber-800 dark:text-amber-200">
						No se pueden crear enlaces de KYC Autoservicio
					</AlertTitle>
					<AlertDescription className="text-amber-700 dark:text-amber-300">
						<p>
							La función está deshabilitada para esta organización. Puedes
							activarla en la configuración de cumplimiento PLD.
						</p>
						<Button variant="outline" size="sm" className="mt-3 gap-2" asChild>
							<a
								href={COMPLIANCE_SETTINGS_URL()}
								target="_self"
								rel="noopener noreferrer"
							>
								<Settings className="h-4 w-4" />
								Ir a configuración de cumplimiento PLD
							</a>
						</Button>
					</AlertDescription>
				</Alert>
			)}

			{hasActiveOrPending && (
				<div className="flex items-start gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3">
					<Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
					<p className="text-xs text-blue-700 dark:text-blue-300">
						Ya existe una sesión activa o en progreso. Sólo puede haber una
						sesión activa por cliente. Revoca la sesión actual para crear una
						nueva.
					</p>
				</div>
			)}

			{/* Session list */}
			{sessions && sessions.length > 0 && (
				<div className="rounded-lg border overflow-hidden divide-y">
					{sessions.map((session) => (
						<SessionCard
							key={session.id}
							session={session}
							onAction={loadSessions}
							kycSelfServiceUrl={kycSelfServiceUrl}
						/>
					))}
				</div>
			)}

			{/* No sessions + not creating */}
			{sessions?.length === 0 && (
				<div className="rounded-lg border border-dashed p-6 text-center">
					<Clock className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
					<p className="text-sm font-medium text-muted-foreground">
						Sin historial de sesiones KYC
					</p>
					<p className="text-xs text-muted-foreground mt-1">
						Crea un enlace de autoservicio para que el cliente complete su
						identificación de manera remota.
					</p>
				</div>
			)}
		</div>
	);
}

"use client";

import * as React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	Smartphone,
	Copy,
	Loader2,
	CheckCircle2,
	Clock,
	QrCode,
	RefreshCw,
	AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/lib/org-store";
import { useJwt } from "@/hooks/useJwt";
import {
	createUploadLink,
	getUploadLinkUrl,
	subscribeToUploadLinkEvents,
	type CreateUploadLinkResponse,
	type SSEEvent,
} from "@/lib/api/doc-svc";

const SCAN_APP_URL =
	process.env.NEXT_PUBLIC_SCAN_APP_URL || "https://scan.janovix.com";

interface MobileUploadQRProps {
	/** Whether the QR modal is open */
	open: boolean;
	/** Callback to change open state */
	onOpenChange: (open: boolean) => void;
	/** Document type being uploaded */
	documentType?: string;
	/** Client ID for the upload session */
	clientId?: string;
	/** Callback when upload is completed from mobile */
	onUploadComplete?: (blob: Blob) => void;
}

// Status types for the upload session
type SessionStatus =
	| "loading"
	| "waiting"
	| "scanning"
	| "uploading"
	| "complete"
	| "expired"
	| "error";

export function MobileUploadQR({
	open,
	onOpenChange,
	documentType = "Documento",
	clientId,
	onUploadComplete,
}: MobileUploadQRProps) {
	// Auth context is handled by JWT token - no need for org/user IDs here
	const { currentOrg } = useOrgStore();
	const { jwt } = useJwt();

	const [uploadLink, setUploadLink] = useState<CreateUploadLinkResponse | null>(
		null,
	);
	const [status, setStatus] = useState<SessionStatus>("loading");
	const [timeLeft, setTimeLeft] = useState<number>(0);
	const [error, setError] = useState<string | null>(null);
	const sseCleanupRef = useRef<(() => void) | null>(null);

	// Create upload link when modal opens
	useEffect(() => {
		if (!open) {
			// Cleanup when modal closes
			if (sseCleanupRef.current) {
				sseCleanupRef.current();
				sseCleanupRef.current = null;
			}
			setUploadLink(null);
			setStatus("loading");
			setError(null);
			return;
		}

		if (!currentOrg) {
			setError("No organization context");
			setStatus("error");
			return;
		}

		// Create upload link
		const createLink = async () => {
			setStatus("loading");
			setError(null);

			try {
				// Convert string document type to RequiredDocument object
				const requiredDocs = documentType
					? [
							{
								type: documentType as
									| "other"
									| "mx_ine_front"
									| "mx_ine_back"
									| "passport"
									| "proof_of_address"
									| "proof_of_income"
									| "bank_statement"
									| "utility_bill",
							},
						]
					: [];

				const link = await createUploadLink({
					requiredDocuments: requiredDocs,
					maxUploads: 1,
					allowMultipleFiles: true,
					metadata: clientId ? { clientId } : undefined,
				});

				setUploadLink(link);
				setStatus("waiting");

				// Subscribe to SSE events for real-time updates
				if (jwt) {
					const cleanup = subscribeToUploadLinkEvents(
						link.id,
						jwt,
						(event: SSEEvent) => {
							if (event.type === "document-confirmed") {
								setStatus("complete");
								toast.success("Documento subido exitosamente");
							} else if (event.type === "document-initiated") {
								setStatus("uploading");
							}
						},
						(err) => {
							console.error("SSE error:", err);
						},
					);
					sseCleanupRef.current = cleanup;
				}
			} catch (err) {
				console.error("Failed to create upload link:", err);
				setError(err instanceof Error ? err.message : "Error al crear enlace");
				setStatus("error");
			}
		};

		createLink();

		return () => {
			if (sseCleanupRef.current) {
				sseCleanupRef.current();
				sseCleanupRef.current = null;
			}
		};
	}, [open, currentOrg, documentType, clientId, jwt]);

	// Countdown timer
	useEffect(() => {
		if (!uploadLink?.expiresAt) return;

		const expiresAt = new Date(uploadLink.expiresAt);

		const updateTimer = () => {
			const now = Date.now();
			const remaining = Math.max(0, expiresAt.getTime() - now);
			setTimeLeft(Math.floor(remaining / 1000));

			if (remaining <= 0 && status === "waiting") {
				setStatus("expired");
			}
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [uploadLink?.expiresAt, status]);

	// Format time remaining
	const formatTimeLeft = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// Generate the scan URL using the upload link ID
	const scanUrl = uploadLink
		? getUploadLinkUrl(uploadLink.id, SCAN_APP_URL)
		: "";

	// Copy URL to clipboard
	const handleCopyUrl = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(scanUrl);
			toast.success("URL copiado al portapapeles");
		} catch (err) {
			toast.error("Error al copiar URL");
		}
	}, [scanUrl]);

	// Regenerate upload link
	const handleRefresh = useCallback(async () => {
		if (!currentOrg) return;

		setStatus("loading");
		setError(null);

		// Cleanup previous SSE
		if (sseCleanupRef.current) {
			sseCleanupRef.current();
			sseCleanupRef.current = null;
		}

		try {
			// Convert string document type to RequiredDocument object
			const requiredDocs = documentType
				? [
						{
							type: documentType as
								| "other"
								| "mx_ine_front"
								| "mx_ine_back"
								| "passport"
								| "proof_of_address"
								| "proof_of_income"
								| "bank_statement"
								| "utility_bill",
						},
					]
				: [];

			const link = await createUploadLink({
				requiredDocuments: requiredDocs,
				maxUploads: 1,
				allowMultipleFiles: true,
				metadata: clientId ? { clientId } : undefined,
			});

			setUploadLink(link);
			setStatus("waiting");
			toast.info("Nuevo enlace generado");

			// Subscribe to SSE events
			if (jwt) {
				const cleanup = subscribeToUploadLinkEvents(
					link.id,
					jwt,
					(event: SSEEvent) => {
						if (event.type === "document-confirmed") {
							setStatus("complete");
							toast.success("Documento subido exitosamente");
						} else if (event.type === "document-initiated") {
							setStatus("uploading");
						}
					},
					(err) => {
						console.error("SSE error:", err);
					},
				);
				sseCleanupRef.current = cleanup;
			}
		} catch (err) {
			console.error("Failed to create upload link:", err);
			setError(err instanceof Error ? err.message : "Error al crear enlace");
			setStatus("error");
		}
	}, [currentOrg, documentType, clientId, jwt]);

	// Status indicator component
	const StatusIndicator = () => {
		switch (status) {
			case "loading":
				return (
					<Badge variant="outline" className="gap-1">
						<Loader2 className="h-3 w-3 animate-spin" />
						Creando enlace...
					</Badge>
				);
			case "waiting":
				return (
					<Badge variant="outline" className="gap-1">
						<Clock className="h-3 w-3" />
						Esperando escaneo
					</Badge>
				);
			case "scanning":
				return (
					<Badge
						variant="outline"
						className="gap-1 bg-blue-50 text-blue-700 border-blue-200"
					>
						<Loader2 className="h-3 w-3 animate-spin" />
						Escaneando...
					</Badge>
				);
			case "uploading":
				return (
					<Badge
						variant="outline"
						className="gap-1 bg-amber-50 text-amber-700 border-amber-200"
					>
						<Loader2 className="h-3 w-3 animate-spin" />
						Subiendo...
					</Badge>
				);
			case "complete":
				return (
					<Badge
						variant="outline"
						className="gap-1 bg-green-50 text-green-700 border-green-200"
					>
						<CheckCircle2 className="h-3 w-3" />
						Completado
					</Badge>
				);
			case "expired":
				return (
					<Badge variant="destructive" className="gap-1">
						<Clock className="h-3 w-3" />
						Expirado
					</Badge>
				);
			case "error":
				return (
					<Badge variant="destructive" className="gap-1">
						<AlertCircle className="h-3 w-3" />
						Error
					</Badge>
				);
			default:
				return null;
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Smartphone className="h-5 w-5" />
						Escanear con Celular
					</DialogTitle>
					<DialogDescription>
						Escanea el código QR con tu celular para subir {documentType}{" "}
						directamente desde tu navegador móvil
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center gap-4 py-4">
					{/* QR Code - centered */}
					<div
						className={cn(
							"p-4 bg-white rounded-xl shadow-lg",
							(status === "expired" || status === "error") && "opacity-50",
						)}
					>
						{status === "loading" ? (
							<div className="w-[180px] h-[180px] flex items-center justify-center">
								<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							</div>
						) : status === "error" ? (
							<div className="w-[180px] h-[180px] flex flex-col items-center justify-center gap-2 text-destructive">
								<AlertCircle className="h-8 w-8" />
								<span className="text-xs text-center">{error}</span>
							</div>
						) : uploadLink ? (
							<QRCodeSVG
								value={scanUrl}
								size={180}
								level="M"
								includeMargin={false}
							/>
						) : (
							<div className="w-[180px] h-[180px] flex items-center justify-center">
								<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							</div>
						)}
					</div>

					{/* Status and timer */}
					<div className="flex items-center gap-3">
						<StatusIndicator />
						{status === "waiting" && timeLeft > 0 && (
							<span className="text-sm text-muted-foreground">
								Expira en {formatTimeLeft(timeLeft)}
							</span>
						)}
					</div>
				</div>

				{/* URL display - full width */}
				{uploadLink && status !== "error" && (
					<div className="space-y-2 w-full">
						<label className="text-xs font-medium text-muted-foreground">
							O comparte este enlace:
						</label>
						<div className="flex items-center gap-2 w-full">
							<input
								type="text"
								readOnly
								value={scanUrl}
								className="flex-1 text-xs bg-muted px-3 py-2 rounded border-0 min-w-0"
							/>
							<Button
								variant="outline"
								size="icon"
								className="shrink-0"
								onClick={handleCopyUrl}
								disabled={!uploadLink || status === "expired"}
							>
								<Copy className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}

				{/* Refresh button (when expired or error) */}
				{(status === "expired" || status === "error") && (
					<Button onClick={handleRefresh} className="w-full">
						<RefreshCw className="h-4 w-4 mr-2" />
						{status === "error" ? "Reintentar" : "Generar Nuevo QR"}
					</Button>
				)}

				{/* Help text */}
				<p className="text-xs text-muted-foreground text-center">
					El enlace abrirá una página web donde podrás tomar una foto del
					documento con la cámara de tu celular
				</p>
			</DialogContent>
		</Dialog>
	);
}

/**
 * Compact QR trigger button for use in upload cards
 */
interface MobileUploadTriggerProps {
	onClick: () => void;
	disabled?: boolean;
	className?: string;
}

export function MobileUploadTrigger({
	onClick,
	disabled,
	className,
}: MobileUploadTriggerProps) {
	return (
		<Button
			variant="outline"
			size="sm"
			onClick={onClick}
			disabled={disabled}
			className={cn("gap-2", className)}
		>
			<QrCode className="h-4 w-4" />
			<span className="hidden sm:inline">Escanear con Celular</span>
			<span className="sm:hidden">QR</span>
		</Button>
	);
}

"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

// Mock session ID generator
function generateSessionId(): string {
	return `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Status types for the upload session
type SessionStatus =
	| "waiting"
	| "scanning"
	| "uploading"
	| "complete"
	| "expired";

export function MobileUploadQR({
	open,
	onOpenChange,
	documentType = "Documento",
	clientId,
	onUploadComplete,
}: MobileUploadQRProps) {
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [status, setStatus] = useState<SessionStatus>("waiting");
	const [expiresAt, setExpiresAt] = useState<Date | null>(null);
	const [timeLeft, setTimeLeft] = useState<number>(0);

	// Generate session when modal opens
	useEffect(() => {
		if (open) {
			const newSessionId = generateSessionId();
			setSessionId(newSessionId);
			setStatus("waiting");
			// Session expires in 10 minutes
			const expiry = new Date(Date.now() + 10 * 60 * 1000);
			setExpiresAt(expiry);
		} else {
			setSessionId(null);
			setStatus("waiting");
			setExpiresAt(null);
		}
	}, [open]);

	// Countdown timer
	useEffect(() => {
		if (!expiresAt) return;

		const updateTimer = () => {
			const now = Date.now();
			const remaining = Math.max(0, expiresAt.getTime() - now);
			setTimeLeft(Math.floor(remaining / 1000));

			if (remaining <= 0) {
				setStatus("expired");
			}
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [expiresAt]);

	// Format time remaining
	const formatTimeLeft = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// Generate the scan URL
	const scanUrl = sessionId
		? `https://scan.janovix.com/${sessionId}?doc=${encodeURIComponent(documentType)}&client=${clientId || ""}`
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

	// Regenerate session
	const handleRefresh = useCallback(() => {
		const newSessionId = generateSessionId();
		setSessionId(newSessionId);
		setStatus("waiting");
		const expiry = new Date(Date.now() + 10 * 60 * 1000);
		setExpiresAt(expiry);
		toast.info("Sesión renovada");
	}, []);

	// Status indicator component
	const StatusIndicator = () => {
		switch (status) {
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
							status === "expired" && "opacity-50",
						)}
					>
						{sessionId ? (
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
						{status !== "expired" && status !== "complete" && (
							<span className="text-sm text-muted-foreground">
								Expira en {formatTimeLeft(timeLeft)}
							</span>
						)}
					</div>
				</div>

				{/* URL display - full width */}
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
							disabled={!sessionId || status === "expired"}
						>
							<Copy className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Refresh button (only when expired) */}
				{status === "expired" && (
					<Button onClick={handleRefresh} className="w-full">
						<RefreshCw className="h-4 w-4 mr-2" />
						Generar Nuevo QR
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

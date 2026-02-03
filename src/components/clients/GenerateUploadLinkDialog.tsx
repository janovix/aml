"use client";

import * as React from "react";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogBody,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Link2,
	Copy,
	Loader2,
	CheckCircle2,
	Clock,
	RefreshCw,
	AlertCircle,
	FileText,
	CreditCard,
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
import {
	getDocumentsForPersonType,
	getApiDocumentsForSelection,
	getDefaultSelectedDocuments,
	isDocumentUploaded,
	type UploadLinkDocumentConfig,
} from "@/lib/constants/upload-link-documents";
import type { PersonType } from "@/types/client";
import type { ClientDocumentType } from "@/types/client-document";

const SCAN_APP_URL =
	process.env.NEXT_PUBLIC_SCAN_APP_URL || "https://scan.janovix.com";

interface GenerateUploadLinkDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Callback to change open state */
	onOpenChange: (open: boolean) => void;
	/** Client type (physical/moral/trust) */
	clientType: PersonType;
	/** Client ID for metadata */
	clientId?: string;
	/** Client name for display */
	clientName?: string;
	/** Already uploaded document types */
	uploadedDocuments?: ClientDocumentType[];
	/** Callback when documents are uploaded */
	onUploadComplete?: () => void;
	/** Callback when a new link is generated (for persistence) */
	onLinkGenerated?: (
		link: CreateUploadLinkResponse,
		selectedDocuments: string[],
	) => void;
}

type DialogStep = "select" | "qr";
type SessionStatus =
	| "loading"
	| "waiting"
	| "scanning"
	| "uploading"
	| "complete"
	| "expired"
	| "error";

/**
 * Get icon for document type
 */
function getDocumentIcon(doc: UploadLinkDocumentConfig) {
	if (doc.id === "official_id") return <CreditCard className="h-4 w-4" />;
	return <FileText className="h-4 w-4" />;
}

export function GenerateUploadLinkDialog({
	open,
	onOpenChange,
	clientType,
	clientId,
	clientName,
	uploadedDocuments = [],
	onUploadComplete,
	onLinkGenerated,
}: GenerateUploadLinkDialogProps) {
	const { currentOrg } = useOrgStore();
	const { jwt } = useJwt();

	// Dialog state
	const [step, setStep] = useState<DialogStep>("select");
	const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
	const [uploadLink, setUploadLink] = useState<CreateUploadLinkResponse | null>(
		null,
	);
	const [status, setStatus] = useState<SessionStatus>("loading");
	const [timeLeft, setTimeLeft] = useState<number>(0);
	const [error, setError] = useState<string | null>(null);
	const [uploadedCount, setUploadedCount] = useState(0);
	const sseCleanupRef = useRef<(() => void) | null>(null);

	// Get available documents for this client type
	const availableDocuments = useMemo(
		() => getDocumentsForPersonType(clientType),
		[clientType],
	);

	// Initialize selected documents when dialog opens
	useEffect(() => {
		if (open) {
			setStep("select");
			setSelectedDocuments(getDefaultSelectedDocuments(clientType));
			setUploadLink(null);
			setStatus("loading");
			setError(null);
			setUploadedCount(0);
		} else {
			// Cleanup when dialog closes
			if (sseCleanupRef.current) {
				sseCleanupRef.current();
				sseCleanupRef.current = null;
			}
		}
	}, [open, clientType]);

	// Handle document selection
	const handleDocumentToggle = useCallback((docId: string) => {
		setSelectedDocuments((prev) => {
			if (prev.includes(docId)) {
				return prev.filter((id) => id !== docId);
			} else {
				return [...prev, docId];
			}
		});
	}, []);

	// Generate upload link
	const handleGenerateLink = useCallback(async () => {
		if (!currentOrg || selectedDocuments.length === 0) return;

		setStep("qr");
		setStatus("loading");
		setError(null);

		try {
			const apiDocs = getApiDocumentsForSelection(
				selectedDocuments,
				clientType,
			);

			const link = await createUploadLink({
				requiredDocuments: apiDocs,
				maxUploads: undefined, // No limit
				allowMultipleFiles: true,
				expiresInHours: 24,
				metadata: {
					clientId,
					clientName,
				},
			});

			setUploadLink(link);
			setStatus("waiting");

			// Notify parent about the new link (for persistence)
			onLinkGenerated?.(link, selectedDocuments);

			// Subscribe to SSE events for real-time updates
			if (jwt) {
				const cleanup = subscribeToUploadLinkEvents(
					link.id,
					jwt,
					(event: SSEEvent) => {
						if (event.type === "document-confirmed") {
							setUploadedCount((prev) => prev + 1);
							toast.success("Documento subido exitosamente");
							onUploadComplete?.();
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
	}, [
		currentOrg,
		selectedDocuments,
		clientType,
		clientId,
		clientName,
		jwt,
		onUploadComplete,
		onLinkGenerated,
	]);

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
		const hours = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		if (hours > 0) {
			return `${hours}h ${mins}m`;
		}
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// Generate the scan URL
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

		if (sseCleanupRef.current) {
			sseCleanupRef.current();
			sseCleanupRef.current = null;
		}

		try {
			const apiDocs = getApiDocumentsForSelection(
				selectedDocuments,
				clientType,
			);

			const link = await createUploadLink({
				requiredDocuments: apiDocs,
				maxUploads: undefined,
				allowMultipleFiles: true,
				expiresInHours: 24,
				metadata: {
					clientId,
					clientName,
				},
			});

			setUploadLink(link);
			setStatus("waiting");
			setUploadedCount(0);
			toast.info("Nuevo enlace generado");

			// Notify parent about the new link (for persistence)
			onLinkGenerated?.(link, selectedDocuments);

			if (jwt) {
				const cleanup = subscribeToUploadLinkEvents(
					link.id,
					jwt,
					(event: SSEEvent) => {
						if (event.type === "document-confirmed") {
							setUploadedCount((prev) => prev + 1);
							toast.success("Documento subido exitosamente");
							onUploadComplete?.();
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
	}, [
		currentOrg,
		selectedDocuments,
		clientType,
		clientId,
		clientName,
		jwt,
		onUploadComplete,
		onLinkGenerated,
	]);

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

	// Count of selected required documents
	const selectedCount = selectedDocuments.length;
	const hasIdSelected = selectedDocuments.some((id) => {
		const doc = availableDocuments.find((d) => d.id === id);
		return doc?.isIdDocument;
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Link2 className="h-5 w-5" />
						{step === "select" ? "Generar Enlace de Carga" : "Enlace de Carga"}
					</DialogTitle>
					<DialogDescription>
						{step === "select"
							? "Selecciona los documentos que deseas solicitar"
							: `Comparte este enlace para que ${clientName || "el cliente"} suba los documentos`}
					</DialogDescription>
				</DialogHeader>

				{step === "select" ? (
					<>
						<DialogBody className="space-y-4">
							{/* Document checklist */}
							<div className="space-y-2">
								{availableDocuments.map((doc) => {
									const isSelected = selectedDocuments.includes(doc.id);
									const isUploaded = isDocumentUploaded(doc, uploadedDocuments);

									return (
										<div
											key={doc.id}
											className={cn(
												"flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
												isSelected
													? "border-primary bg-primary/5"
													: "border-border hover:border-primary/50",
												isUploaded && "bg-green-50 dark:bg-green-950/20",
											)}
											onClick={() => handleDocumentToggle(doc.id)}
										>
											<Checkbox
												checked={isSelected}
												onCheckedChange={() => handleDocumentToggle(doc.id)}
												className="mt-0.5"
											/>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													{getDocumentIcon(doc)}
													<span className="font-medium text-sm">
														{doc.label}
													</span>
													{doc.isRequired && (
														<Badge variant="secondary" className="text-xs">
															Requerido
														</Badge>
													)}
													{isUploaded && (
														<Badge
															variant="outline"
															className="text-xs bg-green-100 text-green-700 border-green-200"
														>
															<CheckCircle2 className="h-3 w-3 mr-1" />
															Subido
														</Badge>
													)}
												</div>
												<p className="text-xs text-muted-foreground mt-0.5">
													{doc.description}
												</p>
											</div>
										</div>
									);
								})}
							</div>

							{/* Selection summary */}
							<div className="text-sm text-muted-foreground">
								{selectedCount} documento{selectedCount !== 1 ? "s" : ""}{" "}
								seleccionado{selectedCount !== 1 ? "s" : ""}
								{clientType === "physical" && !hasIdSelected && (
									<span className="text-amber-600 block mt-1">
										Se recomienda incluir Identificación Oficial
									</span>
								)}
							</div>
						</DialogBody>

						<DialogFooter>
							<Button variant="outline" onClick={() => onOpenChange(false)}>
								Cancelar
							</Button>
							<Button
								onClick={handleGenerateLink}
								disabled={selectedDocuments.length === 0}
							>
								Generar Enlace
							</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogBody>
							<div className="flex flex-col items-center gap-4">
								{/* QR Code */}
								<div
									className={cn(
										"p-4 bg-white rounded-xl shadow-lg",
										(status === "expired" || status === "error") &&
											"opacity-50",
									)}
								>
									{status === "loading" ? (
										<div className="w-[200px] h-[200px] flex items-center justify-center">
											<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
										</div>
									) : status === "error" ? (
										<div className="w-[200px] h-[200px] flex flex-col items-center justify-center gap-2 text-destructive">
											<AlertCircle className="h-8 w-8" />
											<span className="text-xs text-center">{error}</span>
										</div>
									) : uploadLink ? (
										<QRCodeSVG
											value={scanUrl}
											size={200}
											level="M"
											includeMargin={false}
										/>
									) : (
										<div className="w-[200px] h-[200px] flex items-center justify-center">
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

								{/* Upload count */}
								{uploadedCount > 0 && (
									<div className="flex items-center gap-2 text-sm text-green-600">
										<CheckCircle2 className="h-4 w-4" />
										{uploadedCount} documento{uploadedCount !== 1 ? "s" : ""}{" "}
										subido{uploadedCount !== 1 ? "s" : ""}
									</div>
								)}

								{/* URL display */}
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

								{/* Refresh button */}
								{(status === "expired" || status === "error") && (
									<Button onClick={handleRefresh} className="w-full">
										<RefreshCw className="h-4 w-4 mr-2" />
										{status === "error" ? "Reintentar" : "Generar Nuevo Enlace"}
									</Button>
								)}
							</div>
						</DialogBody>

						<DialogFooter>
							<Button variant="outline" onClick={() => setStep("select")}>
								Cambiar Documentos
							</Button>
							<Button onClick={() => onOpenChange(false)}>Cerrar</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

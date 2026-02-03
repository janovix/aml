"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Smartphone,
	Link2,
	Copy,
	Clock,
	CheckCircle2,
	RefreshCw,
	ChevronDown,
	Loader2,
	ExternalLink,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useJwt } from "@/hooks/useJwt";
import {
	usePersistedUploadLink,
	formatTimeRemaining,
} from "@/hooks/usePersistedUploadLink";
import {
	getUploadLinkUrl,
	subscribeToUploadLinkEvents,
	type SSEEvent,
} from "@/lib/api/doc-svc";
import { GenerateUploadLinkDialog } from "./GenerateUploadLinkDialog";
import type { PersonType } from "@/types/client";
import type { ClientDocumentType } from "@/types/client-document";

const SCAN_APP_URL =
	process.env.NEXT_PUBLIC_SCAN_APP_URL || "https://scan.janovix.com";

interface MobileUploadCardProps {
	clientId: string;
	clientName?: string;
	clientType: PersonType;
	uploadedDocuments?: ClientDocumentType[];
	onUploadComplete?: () => void;
	className?: string;
}

export function MobileUploadCard({
	clientId,
	clientName,
	clientType,
	uploadedDocuments = [],
	onUploadComplete,
	className,
}: MobileUploadCardProps) {
	const { jwt } = useJwt();
	const {
		persistedLink,
		isLoading,
		isValid,
		timeRemaining,
		saveLink,
		clearLink,
	} = usePersistedUploadLink(clientId);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [uploadedCount, setUploadedCount] = useState(0);
	const [displayTimeRemaining, setDisplayTimeRemaining] =
		useState(timeRemaining);
	const sseCleanupRef = useRef<(() => void) | null>(null);

	// Update display time remaining
	useEffect(() => {
		setDisplayTimeRemaining(timeRemaining);

		if (!isValid || timeRemaining <= 0) return;

		const interval = setInterval(() => {
			setDisplayTimeRemaining((prev) => Math.max(0, prev - 1));
		}, 1000);

		return () => clearInterval(interval);
	}, [timeRemaining, isValid]);

	// Subscribe to SSE events for the persisted link
	useEffect(() => {
		if (!persistedLink || !isValid || !jwt) return;

		const cleanup = subscribeToUploadLinkEvents(
			persistedLink.link.id,
			jwt,
			(event: SSEEvent) => {
				if (event.type === "document-confirmed") {
					setUploadedCount((prev) => prev + 1);
					toast.success("Documento subido exitosamente");
					onUploadComplete?.();
				}
			},
			(err) => {
				console.error("SSE error:", err);
			},
		);
		sseCleanupRef.current = cleanup;

		return () => {
			if (sseCleanupRef.current) {
				sseCleanupRef.current();
				sseCleanupRef.current = null;
			}
		};
	}, [persistedLink, isValid, jwt, onUploadComplete]);

	// Generate scan URL
	const scanUrl = persistedLink
		? getUploadLinkUrl(persistedLink.link.id, SCAN_APP_URL)
		: "";

	// Copy URL to clipboard
	const handleCopyUrl = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(scanUrl);
			toast.success("URL copiado al portapapeles");
		} catch {
			toast.error("Error al copiar URL");
		}
	}, [scanUrl]);

	// Handle dialog close with link saving
	const handleDialogOpenChange = useCallback((open: boolean) => {
		setDialogOpen(open);
	}, []);

	// Handle new link generated from dialog
	const handleLinkGenerated = useCallback(
		(link: Parameters<typeof saveLink>[0], selectedDocuments: string[]) => {
			saveLink(link, selectedDocuments);
			setUploadedCount(0);
			setIsExpanded(true);
		},
		[saveLink],
	);

	// Handle clearing the link
	const handleClearLink = useCallback(() => {
		if (sseCleanupRef.current) {
			sseCleanupRef.current();
			sseCleanupRef.current = null;
		}
		clearLink();
		setUploadedCount(0);
		setIsExpanded(false);
	}, [clearLink]);

	if (isLoading) {
		return (
			<Card className={cn("border-primary/20 bg-primary/5", className)}>
				<CardContent className="p-4">
					<div className="flex items-center justify-center py-2">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				</CardContent>
			</Card>
		);
	}

	// No persisted link - show generate button
	if (!persistedLink || !isValid) {
		return (
			<>
				<Card className={cn("border-primary/20 bg-primary/5", className)}>
					<CardContent className="p-4">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-full bg-primary/10 shrink-0">
									<Smartphone className="h-5 w-5 text-primary" />
								</div>
								<div>
									<h4 className="font-medium text-sm">Carga desde celular</h4>
									<p className="text-xs text-muted-foreground">
										Genera un enlace para que el cliente suba documentos desde
										su celular
									</p>
								</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setDialogOpen(true)}
								className="gap-2 w-full sm:w-auto"
							>
								<Link2 className="h-4 w-4" />
								Generar Enlace
							</Button>
						</div>
					</CardContent>
				</Card>

				<GenerateUploadLinkDialog
					open={dialogOpen}
					onOpenChange={handleDialogOpenChange}
					clientType={clientType}
					clientId={clientId}
					clientName={clientName}
					uploadedDocuments={uploadedDocuments}
					onUploadComplete={onUploadComplete}
					onLinkGenerated={handleLinkGenerated}
				/>
			</>
		);
	}

	// Has valid persisted link - show it
	return (
		<>
			<Card className={cn("border-primary/20 bg-primary/5", className)}>
				<CardContent className="p-4">
					<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-full bg-primary/10 shrink-0">
									<Smartphone className="h-5 w-5 text-primary" />
								</div>
								<div>
									<h4 className="font-medium text-sm flex items-center gap-2">
										Carga desde celular
										<Badge variant="outline" className="text-xs gap-1">
											<CheckCircle2 className="h-3 w-3 text-green-600" />
											Enlace activo
										</Badge>
									</h4>
									<p className="text-xs text-muted-foreground flex items-center gap-2">
										<Clock className="h-3 w-3" />
										Expira en {formatTimeRemaining(displayTimeRemaining)}
										{uploadedCount > 0 && (
											<span className="text-green-600">
												• {uploadedCount} documento
												{uploadedCount !== 1 ? "s" : ""} subido
												{uploadedCount !== 1 ? "s" : ""}
											</span>
										)}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<CollapsibleTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="gap-2 w-full sm:w-auto"
									>
										<ChevronDown
											className={cn(
												"h-4 w-4 transition-transform",
												isExpanded && "rotate-180",
											)}
										/>
										{isExpanded ? "Ocultar" : "Ver Enlace"}
									</Button>
								</CollapsibleTrigger>
							</div>
						</div>

						<CollapsibleContent className="mt-4">
							<div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
								{/* QR Code */}
								<div className="p-3 bg-white rounded-lg shadow-sm shrink-0">
									<QRCodeSVG
										value={scanUrl}
										size={120}
										level="M"
										includeMargin={false}
									/>
								</div>

								{/* Link details */}
								<div className="flex-1 space-y-3 w-full">
									{/* URL */}
									<div className="space-y-1">
										<label className="text-xs font-medium text-muted-foreground">
											Enlace de carga
										</label>
										<div className="flex items-center gap-2">
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
												title="Copiar URL"
											>
												<Copy className="h-4 w-4" />
											</Button>
											<Button
												variant="outline"
												size="icon"
												className="shrink-0"
												asChild
											>
												<a
													href={scanUrl}
													target="_blank"
													rel="noopener noreferrer"
													title="Abrir enlace"
												>
													<ExternalLink className="h-4 w-4" />
												</a>
											</Button>
										</div>
									</div>

									{/* Selected documents */}
									{persistedLink.selectedDocuments.length > 0 && (
										<div className="space-y-1">
											<label className="text-xs font-medium text-muted-foreground">
												Documentos solicitados
											</label>
											<div className="flex flex-wrap gap-1">
												{persistedLink.selectedDocuments.map((docId) => (
													<Badge
														key={docId}
														variant="secondary"
														className="text-xs"
													>
														{docId}
													</Badge>
												))}
											</div>
										</div>
									)}

									{/* Actions */}
									<div className="flex items-center gap-2 pt-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setDialogOpen(true)}
											className="gap-1"
										>
											<RefreshCw className="h-3 w-3" />
											Nuevo Enlace
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={handleClearLink}
											className="gap-1 text-muted-foreground hover:text-destructive"
										>
											<Trash2 className="h-3 w-3" />
											Descartar
										</Button>
									</div>
								</div>
							</div>
						</CollapsibleContent>
					</Collapsible>
				</CardContent>
			</Card>

			<GenerateUploadLinkDialog
				open={dialogOpen}
				onOpenChange={handleDialogOpenChange}
				clientType={clientType}
				clientId={clientId}
				clientName={clientName}
				uploadedDocuments={uploadedDocuments}
				onUploadComplete={onUploadComplete}
				onLinkGenerated={handleLinkGenerated}
			/>
		</>
	);
}

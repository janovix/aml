"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Link2,
	Copy,
	Check,
	ExternalLink,
	Loader2,
	FileText,
	RefreshCw,
	QrCode,
	Share2,
	AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
	createUploadLink,
	getUploadLinkUrl,
	subscribeToUploadLinkEvents,
	listUploadLinkDocuments,
	type CreateUploadLinkInput,
	type UploadLinkResponse,
	type UploadLinkDocument,
	type SSEEvent,
} from "@/lib/api/doc-svc";
import { cn } from "@/lib/utils";
import { useJwt } from "@/hooks/useJwt";

interface UploadLinkManagerProps {
	clientId: string;
	clientName: string;
	requiredDocuments?: string[];
	onDocumentUploaded?: (document: UploadLinkDocument) => void;
	className?: string;
}

export function UploadLinkManager({
	clientId,
	clientName,
	requiredDocuments = [],
	onDocumentUploaded,
	className,
}: UploadLinkManagerProps) {
	const { jwt } = useJwt();
	const [isCreating, setIsCreating] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [activeLink, setActiveLink] = useState<UploadLinkResponse | null>(null);
	const [documents, setDocuments] = useState<UploadLinkDocument[]>([]);
	const [copied, setCopied] = useState(false);
	const [isConnected, setIsConnected] = useState(false);

	// Generate the shareable URL
	const shareableUrl = activeLink ? getUploadLinkUrl(activeLink.id) : null;

	// Create a new upload link
	const handleCreateLink = useCallback(async () => {
		setIsCreating(true);
		try {
			// Convert string document types to RequiredDocument objects
			const requiredDocs =
				requiredDocuments.length > 0
					? requiredDocuments.map((type) => ({
							type: type as
								| "other"
								| "mx_ine_front"
								| "mx_ine_back"
								| "passport"
								| "proof_of_address"
								| "proof_of_income"
								| "bank_statement"
								| "utility_bill",
						}))
					: undefined;

			const input: CreateUploadLinkInput = {
				requiredDocuments: requiredDocs,
				maxUploads: requiredDocuments.length || 10,
				allowMultipleFiles: true,
				expiresInHours: 72, // 3 days
				metadata: {
					clientId,
					clientName,
				},
			};

			const link = await createUploadLink(input);
			setActiveLink(link as unknown as UploadLinkResponse);
			setIsDialogOpen(false);
			toast.success("Enlace creado exitosamente");
		} catch (err) {
			console.error("Failed to create upload link:", err);
			toast.error("Error al crear el enlace de subida");
		} finally {
			setIsCreating(false);
		}
	}, [clientId, clientName, requiredDocuments]);

	// Copy link to clipboard
	const handleCopyLink = useCallback(async () => {
		if (!shareableUrl) return;

		try {
			await navigator.clipboard.writeText(shareableUrl);
			setCopied(true);
			toast.success("Enlace copiado al portapapeles");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Error al copiar el enlace");
		}
	}, [shareableUrl]);

	// Share link using Web Share API
	const handleShareLink = useCallback(async () => {
		if (!shareableUrl || !navigator.share) return;

		try {
			await navigator.share({
				title: `Subir documentos - ${clientName}`,
				text: `Por favor sube los documentos requeridos usando este enlace`,
				url: shareableUrl,
			});
		} catch (err) {
			// User cancelled or share failed
			if ((err as Error).name !== "AbortError") {
				console.error("Share failed:", err);
			}
		}
	}, [shareableUrl, clientName]);

	// Subscribe to SSE events when link is active
	useEffect(() => {
		if (!activeLink || !jwt) return;

		// Initial fetch of documents
		listUploadLinkDocuments(activeLink.id)
			.then(setDocuments)
			.catch(console.error);

		// Subscribe to real-time events
		const unsubscribe = subscribeToUploadLinkEvents(
			activeLink.id,
			jwt,
			(event: SSEEvent) => {
				if (event.type === "document-confirmed" && event.data?.documentId) {
					// Refresh documents list
					listUploadLinkDocuments(activeLink.id)
						.then((docs) => {
							setDocuments(docs);
							const newDoc = docs.find((d) => d.id === event.data?.documentId);
							if (newDoc) {
								onDocumentUploaded?.(newDoc);
								toast.success("Nuevo documento recibido");
							}
						})
						.catch(console.error);
				} else if (event.type === "upload-link-updated") {
					setActiveLink((prev) =>
						prev
							? {
									...prev,
									uploadedCount:
										event.data?.uploadedCount ?? prev.uploadedCount,
									status:
										(event.data?.status as UploadLinkResponse["status"]) ??
										prev.status,
								}
							: null,
					);
				}
				setIsConnected(true);
			},
			() => {
				setIsConnected(false);
			},
		);

		return unsubscribe;
	}, [activeLink, jwt, onDocumentUploaded]);

	return (
		<Card className={cn("overflow-hidden", className)}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Link2 className="h-5 w-5 text-primary" />
						<CardTitle className="text-base">Enlace de Subida</CardTitle>
					</div>
					{isConnected && (
						<Badge
							variant="outline"
							className="text-green-600 border-green-300"
						>
							<span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
							En vivo
						</Badge>
					)}
				</div>
				<CardDescription>
					Comparte un enlace para que el cliente suba sus documentos
					directamente
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{!activeLink ? (
					// No active link - show create button
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogTrigger asChild>
							<Button className="w-full gap-2">
								<Link2 className="h-4 w-4" />
								Crear Enlace de Subida
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Crear Enlace de Subida</DialogTitle>
								<DialogDescription>
									El enlace permitirá al cliente subir documentos de forma
									segura
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label>Cliente</Label>
									<Input value={clientName} disabled />
								</div>

								{requiredDocuments.length > 0 && (
									<div className="space-y-2">
										<Label>Documentos Requeridos</Label>
										<div className="flex flex-wrap gap-2">
											{requiredDocuments.map((doc) => (
												<Badge key={doc} variant="secondary">
													{doc}
												</Badge>
											))}
										</div>
									</div>
								)}

								<div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
									<p>El enlace expirará en 72 horas</p>
								</div>
							</div>

							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
								>
									Cancelar
								</Button>
								<Button onClick={handleCreateLink} disabled={isCreating}>
									{isCreating ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Creando...
										</>
									) : (
										<>
											<Link2 className="h-4 w-4 mr-2" />
											Crear Enlace
										</>
									)}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				) : (
					// Active link - show URL and status
					<>
						{/* Link URL */}
						<div className="space-y-2">
							<Label className="text-xs text-muted-foreground">
								Enlace Compartible
							</Label>
							<div className="flex gap-2">
								<Input
									value={shareableUrl || ""}
									readOnly
									className="font-mono text-sm"
								/>
								<Button variant="outline" size="icon" onClick={handleCopyLink}>
									{copied ? (
										<Check className="h-4 w-4 text-green-500" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</Button>
								{typeof navigator !== "undefined" &&
									typeof navigator.share === "function" && (
										<Button
											variant="outline"
											size="icon"
											onClick={handleShareLink}
										>
											<Share2 className="h-4 w-4" />
										</Button>
									)}
								<Button variant="outline" size="icon" asChild>
									<a
										href={shareableUrl || "#"}
										target="_blank"
										rel="noopener noreferrer"
									>
										<ExternalLink className="h-4 w-4" />
									</a>
								</Button>
							</div>
						</div>

						{/* Status */}
						<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
							<div className="flex items-center gap-2">
								<FileText className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm">
									{activeLink.uploadedCount} de {activeLink.maxUploads || "∞"}{" "}
									documentos
								</span>
							</div>
							<Badge
								variant={
									activeLink.status === "ACTIVE"
										? "default"
										: activeLink.status === "COMPLETED"
											? "secondary"
											: "destructive"
								}
							>
								{activeLink.status === "ACTIVE" && "Activo"}
								{activeLink.status === "COMPLETED" && "Completado"}
								{activeLink.status === "EXPIRED" && "Expirado"}
							</Badge>
						</div>

						{/* Uploaded documents list */}
						{documents.length > 0 && (
							<div className="space-y-2">
								<Label className="text-xs text-muted-foreground">
									Documentos Recibidos
								</Label>
								<div className="space-y-2">
									{documents.map((doc) => (
										<div
											key={doc.id}
											className="flex items-center justify-between p-2 rounded-md border bg-card"
										>
											<div className="flex items-center gap-2 min-w-0">
												<FileText className="h-4 w-4 text-primary shrink-0" />
												<span className="text-sm truncate">{doc.fileName}</span>
											</div>
											<Badge variant="outline" className="shrink-0">
												{doc.pageCount} pág.
											</Badge>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Create new link button */}
						<Button
							variant="outline"
							size="sm"
							className="w-full"
							onClick={() => setActiveLink(null)}
						>
							<RefreshCw className="h-4 w-4 mr-2" />
							Crear Nuevo Enlace
						</Button>
					</>
				)}
			</CardContent>
		</Card>
	);
}

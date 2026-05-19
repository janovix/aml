"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Upload, Trash2, Loader2, FileText } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { toast } from "sonner";
import { addEvidence, removeEvidence } from "@/lib/api/operation-exceptions";
import type { OperationExceptionEvidenceEntity } from "@/types/operation";
import { uploadDocument } from "@/lib/api/doc-svc";
import { useOrgStore } from "@/lib/org-store";

const EVIDENCE_TYPES = [
	{ code: "DEED", label: "Escritura" },
	{ code: "CONTRACT", label: "Contrato" },
	{ code: "FIRST_SALE_CERTIFICATE", label: "Certificado de primera venta" },
	{ code: "BANK_INSTRUCTION_LETTER", label: "Carta instrucción bancaria" },
	{ code: "PAYMENT_RECEIPT", label: "Comprobante de pago" },
	{ code: "DEVELOPER_STATEMENT", label: "Declaración del desarrollador" },
	{
		code: "BENEFICIAL_CONTROLLER_FILE",
		label: "Expediente de beneficiario controlador",
	},
	{ code: "OTHER", label: "Otro" },
] as const;

interface EvidenceUploaderProps {
	operationId: string;
	evidence: OperationExceptionEvidenceEntity[];
	onUpdate: () => void;
	disabled?: boolean;
}

export function EvidenceUploader({
	operationId,
	evidence,
	onUpdate,
	disabled,
}: EvidenceUploaderProps) {
	const { t } = useLanguage();
	const currentOrg = useOrgStore((s) => s.currentOrg);
	const currentUserId = useOrgStore((s) => s.currentUserId);
	const [uploading, setUploading] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [selectedType, setSelectedType] = useState("");
	const [description, setDescription] = useState("");

	const handleUpload = async (file: File) => {
		if (!selectedType) {
			toast.error("Seleccione un tipo de evidencia");
			return;
		}
		if (!currentOrg?.id || !currentUserId) {
			toast.error("Sesión no disponible");
			return;
		}

		setUploading(true);
		try {
			const uploadResult = await uploadDocument(
				currentOrg.id,
				currentUserId,
				[file],
				file.type === "application/pdf" ? file : null,
				file.name,
			);

			await addEvidence(operationId, {
				evidenceType: selectedType,
				description: description || null,
				docSvcDocumentId: uploadResult.documentId,
			});

			setSelectedType("");
			setDescription("");
			toast.success("Evidencia agregada");
			onUpdate();
		} catch {
			toast.error("Error al subir evidencia");
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async (evidenceId: string) => {
		setDeletingId(evidenceId);
		try {
			await removeEvidence(operationId, evidenceId);
			toast.success("Evidencia eliminada");
			onUpdate();
		} catch {
			toast.error("Error al eliminar evidencia");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className="space-y-4 border-t pt-4">
			<h4 className="text-sm font-semibold">{t("opExceptionEvidenceTitle")}</h4>

			{evidence.length > 0 && (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Tipo</TableHead>
							<TableHead>Descripción</TableHead>
							<TableHead>Documento</TableHead>
							<TableHead className="w-[80px]" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{evidence.map((ev) => {
							const typeLabel =
								EVIDENCE_TYPES.find((et) => et.code === ev.evidenceType)
									?.label ?? ev.evidenceType;
							return (
								<TableRow key={ev.id}>
									<TableCell className="font-medium">{typeLabel}</TableCell>
									<TableCell>{ev.description || "—"}</TableCell>
									<TableCell>
										{ev.docSvcDocumentId ? (
											<span className="flex items-center gap-1 text-sm text-muted-foreground">
												<FileText className="h-3.5 w-3.5" />
												{ev.docSvcDocumentId.slice(0, 8)}…
											</span>
										) : (
											"—"
										)}
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDelete(ev.id)}
											disabled={disabled || deletingId === ev.id}
										>
											{deletingId === ev.id ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Trash2 className="h-4 w-4 text-destructive" />
											)}
										</Button>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			)}

			{!disabled && (
				<div className="flex flex-wrap items-end gap-3">
					<div className="space-y-1 min-w-[180px]">
						<Label>Tipo</Label>
						<Select value={selectedType} onValueChange={setSelectedType}>
							<SelectTrigger>
								<SelectValue placeholder="Seleccionar..." />
							</SelectTrigger>
							<SelectContent>
								{EVIDENCE_TYPES.map((et) => (
									<SelectItem key={et.code} value={et.code}>
										{et.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1 flex-1 min-w-[180px]">
						<Label>Descripción (opcional)</Label>
						<Input
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Escritura pública #1234..."
						/>
					</div>
					<div>
						<Label className="sr-only">{t("opExceptionEvidenceUpload")}</Label>
						<Button
							variant="outline"
							disabled={uploading || !selectedType}
							className="relative"
							asChild
						>
							<label className="cursor-pointer">
								{uploading ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Upload className="mr-2 h-4 w-4" />
								)}
								{t("opExceptionEvidenceUpload")}
								<input
									type="file"
									className="absolute inset-0 opacity-0 cursor-pointer"
									accept=".pdf,.jpg,.jpeg,.png"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) handleUpload(file);
										e.target.value = "";
									}}
								/>
							</label>
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

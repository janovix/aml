"use client";

import { useState, useCallback } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FileUploader } from "./FileUploader";
import { useJwt } from "@/hooks/useJwt";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { createImport } from "@/lib/api/imports";
import type { ImportEntityType } from "@/types/import";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateImportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function CreateImportDialog({
	open,
	onOpenChange,
	onSuccess,
}: CreateImportDialogProps) {
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { navigateTo } = useOrgNavigation();
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleFileUpload = useCallback(
		async (file: File, entityType: ImportEntityType) => {
			if (!jwt) {
				setError("Authentication required. Please sign in again.");
				return;
			}

			setIsUploading(true);
			setError(null);

			try {
				const result = await createImport({ file, entityType, jwt });

				// Close dialog and navigate to the import view
				onOpenChange(false);
				onSuccess?.();
				navigateTo(`/import/${result.data.id}`);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Error desconocido";
				setError(errorMessage);
				setIsUploading(false);
			}
		},
		[jwt, navigateTo, onOpenChange, onSuccess],
	);

	const handleOpenChange = (newOpen: boolean) => {
		if (!isUploading) {
			setError(null);
			onOpenChange(newOpen);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Nueva Importación</DialogTitle>
					<DialogDescription>
						Sube un archivo CSV o Excel para importar clientes o transacciones
						de forma masiva.
					</DialogDescription>
				</DialogHeader>

				{error && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<div className="py-4">
					<FileUploader
						onFileUpload={handleFileUpload}
						isUploading={isUploading}
						disabled={isJwtLoading || !jwt}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}

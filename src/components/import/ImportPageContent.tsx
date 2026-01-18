"use client";

import { useState, useCallback } from "react";
import { FileUploader } from "./FileUploader";
import { CatastrophicError } from "./CatastrophicError";
import { useJwt } from "@/hooks/useJwt";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { createImport } from "@/lib/api/imports";
import type {
	ImportEntityType,
	CatastrophicError as CatastrophicErrorType,
} from "@/types/import";

export function ImportPageContent() {
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { navigateTo } = useOrgNavigation();
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<CatastrophicErrorType | null>(null);

	const handleFileUpload = useCallback(
		async (file: File, entityType: ImportEntityType) => {
			if (!jwt) {
				setError({
					type: "AUTH_ERROR",
					message: "Authentication required. Please sign in again.",
					timestamp: new Date().toISOString(),
				});
				return;
			}

			setIsUploading(true);
			setError(null);

			try {
				const result = await createImport({ file, entityType, jwt });

				// Redirect to the import view page
				navigateTo(`/import/${result.data.id}`);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Error desconocido";
				setError({
					type: "UPLOAD_ERROR",
					message: errorMessage,
					timestamp: new Date().toISOString(),
				});
				setIsUploading(false);
			}
		},
		[jwt, navigateTo],
	);

	const handleReset = useCallback(() => {
		setError(null);
		setIsUploading(false);
	}, []);

	const handleRetry = useCallback(() => {
		handleReset();
	}, [handleReset]);

	if (error) {
		return (
			<div className="h-full flex flex-col overflow-hidden bg-background">
				<div className="flex-1 overflow-auto p-4">
					<CatastrophicError
						error={error}
						onRetry={handleRetry}
						onReset={handleReset}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col overflow-hidden bg-background">
			<div className="flex-1 overflow-auto p-4">
				<FileUploader
					onFileUpload={handleFileUpload}
					isUploading={isUploading}
					disabled={isJwtLoading || !jwt}
				/>
			</div>
		</div>
	);
}

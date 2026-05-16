/**
 * Document Viewer Dialog
 * Reusable dialog for viewing document images with gallery navigation and zoom.
 * Delegates UI to {@link ImageGalleryDialog}; preserves legacy props for clients/* callers.
 */

"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useDocSvcUrls } from "@/hooks/useDocSvcUrls";
import {
	ImageGalleryDialog,
	mergeImageGalleryLabels,
	type GalleryImage,
} from "@/components/media/ImageGalleryDialog";

export interface DocumentImage {
	src: string;
	title: string;
}

interface DocumentViewerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Legacy URL-based images */
	images: DocumentImage[];
	initialIndex?: number;
	originalFileUrl?: string | null;
	/** Doc-svc mode: organization ID */
	organizationId?: string;
	/** Doc-svc mode: document ID */
	docSvcDocumentId?: string | null;
}

export function DocumentViewerDialog({
	open,
	onOpenChange,
	images,
	initialIndex = 0,
	originalFileUrl,
	organizationId,
	docSvcDocumentId,
}: DocumentViewerDialogProps) {
	const isDocSvcMode = !!organizationId && !!docSvcDocumentId;
	const { imageUrls: docSvcImageUrls, isLoading: docSvcLoading } =
		useDocSvcUrls({
			organizationId: organizationId || "",
			documentId: isDocSvcMode ? docSvcDocumentId : null,
			type: "images",
		});

	const effectiveImages: GalleryImage[] = isDocSvcMode
		? (docSvcImageUrls || []).map((url, index) => ({
				src: url,
				title:
					index === 0
						? "Frente"
						: index === 1
							? "Reverso"
							: `Página ${index + 1}`,
			}))
		: images;

	const labels = mergeImageGalleryLabels();

	if (isDocSvcMode && docSvcLoading) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-md" fullscreenMobile>
					<div className="flex items-center justify-center p-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<ImageGalleryDialog
			open={open}
			onOpenChange={onOpenChange}
			images={effectiveImages}
			initialIndex={initialIndex}
			labels={labels}
			originalFileUrl={originalFileUrl ?? undefined}
		/>
	);
}

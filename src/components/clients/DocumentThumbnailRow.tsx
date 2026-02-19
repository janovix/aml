"use client";

import * as React from "react";
import { ZoomIn } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocSvcUrls } from "@/hooks/useDocSvcUrls";
import type { ClientDocument } from "@/types/client-document";

export interface DocumentImage {
	src: string;
	title: string;
}

interface DocumentThumbnailRowProps {
	document: ClientDocument;
	orgId: string;
	onImageClick?: (images: DocumentImage[], index: number) => void;
	/** Max thumbnails to show before a "+N more" overflow pill (default: 5, 0 = show all) */
	maxVisible?: number;
	className?: string;
}

/**
 * Reusable horizontal-scrolling thumbnail row for an uploaded document.
 *
 * - If the document has a `docSvcDocumentId`, fetches presigned image URLs via
 *   `useDocSvcUrls` and renders them.
 * - Otherwise falls back to legacy metadata: `rasterizedPageUrls`, `ineFrontUrl` /
 *   `ineBackUrl`, or the top-level `fileUrl`.
 *
 * Used in both the read-only details view and the edit/upload section so the
 * same thumbnail experience appears everywhere a document card is shown.
 */
export function DocumentThumbnailRow({
	document,
	orgId,
	onImageClick,
	maxVisible = 5,
	className,
}: DocumentThumbnailRowProps) {
	const hasDocSvc = !!(document.docSvcDocumentId && orgId);

	const { imageUrls, isLoading } = useDocSvcUrls({
		organizationId: orgId,
		documentId: hasDocSvc ? document.docSvcDocumentId : null,
		type: "images",
		autoRefresh: false,
	});

	// Build images list from doc-svc or legacy metadata
	const images: DocumentImage[] = React.useMemo(() => {
		const safeImageUrls = imageUrls ?? [];
		if (hasDocSvc && safeImageUrls.length > 0) {
			return safeImageUrls.map((src, i) => ({
				src,
				title: `Página ${i + 1}`,
			}));
		}

		// Legacy metadata fallback
		const meta = document.metadata as
			| Record<string, unknown>
			| null
			| undefined;
		if (!meta) {
			if (document.fileUrl) {
				return [{ src: document.fileUrl, title: "Documento" }];
			}
			return [];
		}

		if (
			Array.isArray(meta.rasterizedPageUrls) &&
			meta.rasterizedPageUrls.length > 0
		) {
			return (meta.rasterizedPageUrls as string[]).map((src, i) => ({
				src,
				title: `Página ${i + 1}`,
			}));
		}

		const legacy: DocumentImage[] = [];
		if (typeof meta.ineFrontUrl === "string") {
			legacy.push({ src: meta.ineFrontUrl, title: "Frente" });
		}
		if (typeof meta.ineBackUrl === "string") {
			legacy.push({ src: meta.ineBackUrl, title: "Reverso" });
		}
		if (legacy.length > 0) return legacy;

		if (document.fileUrl) {
			return [{ src: document.fileUrl, title: "Documento" }];
		}

		return [];
	}, [hasDocSvc, imageUrls, document.metadata, document.fileUrl]);

	if (isLoading && hasDocSvc) {
		return (
			<div className={`flex gap-2 overflow-x-auto pb-1 ${className ?? ""}`}>
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-24 w-16 shrink-0 rounded-md" />
				))}
			</div>
		);
	}

	if (images.length === 0) return null;

	const visible = maxVisible > 0 ? images.slice(0, maxVisible) : images;
	const overflow = maxVisible > 0 ? images.length - maxVisible : 0;

	return (
		<div className={`flex gap-2 overflow-x-auto pb-1 ${className ?? ""}`}>
			{visible.map((img, idx) => (
				<div key={idx} className="shrink-0 space-y-1">
					<p className="text-xs text-muted-foreground text-center truncate max-w-16">
						{img.title}
					</p>
					<div
						className="relative rounded-md overflow-hidden bg-muted/30 border cursor-pointer group h-24"
						onClick={() => onImageClick?.(images, idx)}
					>
						<img
							src={img.src}
							alt={img.title}
							className="h-full w-auto object-contain"
							crossOrigin="anonymous"
						/>
						{onImageClick && (
							<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
								<ZoomIn className="h-4 w-4 text-white" />
							</div>
						)}
					</div>
				</div>
			))}
			{overflow > 0 && (
				<div
					className="h-24 px-3 shrink-0 rounded-md border bg-muted/50 flex items-center justify-center cursor-pointer hover:bg-muted/70 transition-colors self-end"
					onClick={() => onImageClick?.(images, maxVisible)}
				>
					<span className="text-xs text-muted-foreground font-medium">
						+{overflow}
					</span>
				</div>
			)}
		</div>
	);
}

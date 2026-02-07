/**
 * DocSvcImage Component
 *
 * Displays images from doc-svc using presigned URLs.
 * Automatically fetches and refreshes presigned URLs.
 */

"use client";

import { useDocSvcImageUrl, useDocSvcUrls } from "@/hooks/useDocSvcUrls";
import { Skeleton } from "@/components/ui/skeleton";

interface DocSvcImageProps {
	/** Organization ID */
	organizationId: string;
	/** doc-svc document ID */
	documentId: string | null | undefined;
	/** Image index (for multi-page documents, default: 0) */
	imageIndex?: number;
	/** Alt text */
	alt: string;
	/** CSS class name */
	className?: string;
	/** Click handler */
	onClick?: () => void;
	/** Fallback content when no document ID */
	fallback?: React.ReactNode;
}

/**
 * Image component that displays images from doc-svc
 *
 * @example
 * ```tsx
 * <DocSvcImage
 *   organizationId={currentOrg.id}
 *   documentId={document.docSvcDocumentId}
 *   alt="ID Document"
 *   className="w-full h-auto"
 * />
 * ```
 */
export function DocSvcImage({
	organizationId,
	documentId,
	imageIndex = 0,
	alt,
	className,
	onClick,
	fallback = null,
}: DocSvcImageProps) {
	const { url, isLoading, error } = useDocSvcImageUrl({
		organizationId,
		documentId,
		imageIndex,
	});

	if (!documentId) {
		return <>{fallback}</>;
	}

	if (isLoading) {
		return <Skeleton className={className} />;
	}

	if (error || !url) {
		console.error("Error loading doc-svc image:", error);
		return <>{fallback}</>;
	}

	return (
		<img
			src={url}
			alt={alt}
			className={className}
			onClick={onClick}
			crossOrigin="anonymous"
		/>
	);
}

/**
 * Props for DocSvcImageGallery
 */
interface DocSvcImageGalleryProps {
	/** Organization ID */
	organizationId: string;
	/** doc-svc document ID */
	documentId: string | null | undefined;
	/** CSS class for the container */
	containerClassName?: string;
	/** CSS class for each image */
	imageClassName?: string;
	/** Click handler for images */
	onImageClick?: (index: number) => void;
	/** Alt text prefix */
	altPrefix?: string;
}

/**
 * Gallery component that displays all images from a doc-svc document
 */
export function DocSvcImageGallery({
	organizationId,
	documentId,
	containerClassName = "flex gap-2",
	imageClassName = "w-24 h-24 object-cover rounded",
	onImageClick,
	altPrefix = "Page",
}: DocSvcImageGalleryProps) {
	const { imageUrls, isLoading, error } = useDocSvcUrls({
		organizationId,
		documentId,
		type: "images",
	});

	if (!documentId) {
		return null;
	}

	if (isLoading) {
		return (
			<div className={containerClassName}>
				<Skeleton className={imageClassName} />
			</div>
		);
	}

	if (error || !imageUrls?.length) {
		return null;
	}

	return (
		<div className={containerClassName}>
			{imageUrls.map((url: string, index: number) => (
				<img
					key={index}
					src={url}
					alt={`${altPrefix} ${index + 1}`}
					className={imageClassName}
					onClick={() => onImageClick?.(index)}
					crossOrigin="anonymous"
				/>
			))}
		</div>
	);
}

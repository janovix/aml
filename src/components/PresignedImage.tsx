/**
 * PresignedImage Component
 * Automatically generates presigned URLs for authenticated file URLs
 * Falls back to proxy if presigned URL generation fails
 */

"use client";

import { usePresignedUrl } from "@/hooks/usePresignedUrl";
import { Skeleton } from "@/components/ui/skeleton";
import * as Sentry from "@sentry/nextjs";

interface PresignedImageProps {
	src: string | undefined | null;
	alt: string;
	className?: string;
	onClick?: () => void;
}

export function PresignedImage({
	src,
	alt,
	className,
	onClick,
}: PresignedImageProps) {
	const { presignedUrl, isLoading, error } = usePresignedUrl({
		url: src,
		expiresInMinutes: 60,
		autoRefresh: true,
	});

	if (!src) {
		return null;
	}

	if (isLoading) {
		return <Skeleton className={className} />;
	}

	if (error) {
		Sentry.captureException(error);
		Sentry.logger.error(
			Sentry.logger.fmt`Error generating presigned URL for image`,
		);
		// Fall back to original URL (will use proxy)
		return (
			<img
				src={src}
				alt={alt}
				className={className}
				onClick={onClick}
				crossOrigin="anonymous"
			/>
		);
	}

	return (
		<img
			src={presignedUrl}
			alt={alt}
			className={className}
			onClick={onClick}
			crossOrigin="anonymous"
		/>
	);
}

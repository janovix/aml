/**
 * PresignedImage Component
 * Automatically generates presigned URLs for authenticated file URLs
 * Falls back to proxy if presigned URL generation fails
 */

"use client";

import { usePresignedUrl } from "@/hooks/usePresignedUrl";
import { Skeleton } from "@/components/ui/skeleton";

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
		console.error("Error generating presigned URL:", error);
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

	console.log("PresignedImage loading:", presignedUrl);

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

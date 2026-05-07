/**
 * Fullscreen-capable image gallery with zoom, pan, pinch, prev/next, and thumbnails.
 */

"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ChevronLeft,
	ChevronRight,
	Download,
	X,
	ZoomIn,
	ZoomOut,
	RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface GalleryImage {
	src: string;
	title: string;
}

export interface ImageGalleryLabels {
	zoomIn: string;
	zoomOut: string;
	resetZoom: string;
	pinchHint: string;
	pdfDownload: string;
	closeAriaLabel: string;
	prevImage: string;
	nextImage: string;
}

/** Defaults preserved for legacy DocumentViewerDialog callers (Spanish UX). */
export const IMAGE_GALLERY_LABELS_ES: ImageGalleryLabels = {
	zoomIn: "Acercar",
	zoomOut: "Alejar",
	resetZoom: "Restablecer zoom",
	pinchHint: "Pellizca para zoom · Doble tap para ampliar",
	pdfDownload: "PDF",
	closeAriaLabel: "Cerrar",
	prevImage: "Imagen anterior",
	nextImage: "Siguiente imagen",
};

export function mergeImageGalleryLabels(
	partial?: Partial<ImageGalleryLabels>,
): ImageGalleryLabels {
	return { ...IMAGE_GALLERY_LABELS_ES, ...partial };
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

export interface ImageGalleryDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	images: GalleryImage[];
	initialIndex?: number;
	labels: ImageGalleryLabels;
	originalFileUrl?: string | null;
}

export function ImageGalleryDialog({
	open,
	onOpenChange,
	images,
	initialIndex = 0,
	labels,
	originalFileUrl,
}: ImageGalleryDialogProps) {
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [zoom, setZoom] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

	const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(
		null,
	);

	const resetZoom = useCallback(() => {
		setZoom(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	useEffect(() => {
		if (open) {
			setCurrentIndex(initialIndex);
			resetZoom();
		}
	}, [open, initialIndex, resetZoom]);

	useEffect(() => {
		resetZoom();
	}, [currentIndex, resetZoom]);

	const handleZoomIn = useCallback(() => {
		setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
	}, []);

	const handleZoomOut = useCallback(() => {
		setZoom((prev) => {
			const newZoom = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
			if (newZoom === 1) {
				setPosition({ x: 0, y: 0 });
			}
			return newZoom;
		});
	}, []);

	const handleWheel = useCallback((e: React.WheelEvent) => {
		e.preventDefault();
		const delta = e.deltaY > 0 ? -ZOOM_STEP / 2 : ZOOM_STEP / 2;
		setZoom((prev) => {
			const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta));
			if (newZoom === 1) {
				setPosition({ x: 0, y: 0 });
			}
			return newZoom;
		});
	}, []);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (zoom > 1) {
				setIsDragging(true);
				setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
			}
		},
		[zoom, position],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (isDragging && zoom > 1) {
				const newX = e.clientX - dragStart.x;
				const newY = e.clientY - dragStart.y;
				setPosition({ x: newX, y: newY });
			}
		},
		[isDragging, zoom, dragStart],
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	const getTouchDistance = (touches: React.TouchList): number => {
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	};

	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (e.touches.length === 2) {
				setLastTouchDistance(getTouchDistance(e.touches));
			} else if (e.touches.length === 1 && zoom > 1) {
				setIsDragging(true);
				setDragStart({
					x: e.touches[0].clientX - position.x,
					y: e.touches[0].clientY - position.y,
				});
			}
		},
		[zoom, position],
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (e.touches.length === 2 && lastTouchDistance !== null) {
				e.preventDefault();
				const newDistance = getTouchDistance(e.touches);
				const scale = newDistance / lastTouchDistance;
				const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * scale));

				setZoom(newZoom);
				setLastTouchDistance(newDistance);

				if (newZoom === 1) {
					setPosition({ x: 0, y: 0 });
				}
			} else if (e.touches.length === 1 && isDragging && zoom > 1) {
				const newX = e.touches[0].clientX - dragStart.x;
				const newY = e.touches[0].clientY - dragStart.y;
				setPosition({ x: newX, y: newY });
			}
		},
		[lastTouchDistance, zoom, isDragging, dragStart],
	);

	const handleTouchEnd = useCallback(() => {
		setLastTouchDistance(null);
		setIsDragging(false);
	}, []);

	const lastTapRef = useRef<number>(0);
	const handleDoubleTap = useCallback(
		(_e: React.TouchEvent) => {
			const now = Date.now();
			if (now - lastTapRef.current < 300) {
				if (zoom > 1) {
					resetZoom();
				} else {
					setZoom(2.5);
				}
			}
			lastTapRef.current = now;
		},
		[zoom, resetZoom],
	);

	const handlePrev = () => {
		setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
	};

	const handleNext = () => {
		setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
	};

	const currentImage = images[currentIndex];

	const crossOrigin =
		currentImage?.src.startsWith("http://") ||
		currentImage?.src.startsWith("https://")
			? "anonymous"
			: undefined;

	if (!currentImage || images.length === 0) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="sm:max-w-4xl p-0 gap-0 overflow-hidden"
				showCloseButton={false}
				fullscreenMobile
			>
				<DialogHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
					<div className="flex items-center justify-between gap-3">
						<DialogTitle className="text-base sm:text-lg truncate">
							{currentImage.title}
						</DialogTitle>
						<div className="flex items-center gap-1 sm:gap-2 shrink-0">
							{images.length > 1 && (
								<span className="text-xs sm:text-sm text-muted-foreground mr-1 tabular-nums">
									{currentIndex + 1} / {images.length}
								</span>
							)}

							<div className="hidden sm:flex items-center gap-1 border rounded-lg p-0.5 bg-muted/30">
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-7 w-7"
									onClick={handleZoomOut}
									disabled={zoom <= MIN_ZOOM}
									aria-label={labels.zoomOut}
								>
									<ZoomOut className="h-4 w-4" aria-hidden />
								</Button>
								<span className="text-xs w-12 text-center tabular-nums">
									{Math.round(zoom * 100)}%
								</span>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-7 w-7"
									onClick={handleZoomIn}
									disabled={zoom >= MAX_ZOOM}
									aria-label={labels.zoomIn}
								>
									<ZoomIn className="h-4 w-4" aria-hidden />
								</Button>
								{zoom !== 1 && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={resetZoom}
										title={labels.resetZoom}
										aria-label={labels.resetZoom}
									>
										<RotateCcw className="h-3.5 w-3.5" aria-hidden />
									</Button>
								)}
							</div>

							{originalFileUrl && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-8"
									onClick={() => window.open(originalFileUrl, "_blank")}
								>
									<Download className="h-4 w-4 sm:mr-2" aria-hidden />
									<span className="hidden sm:inline">{labels.pdfDownload}</span>
								</Button>
							)}
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-8 w-8 rounded-full"
								onClick={() => onOpenChange(false)}
								aria-label={labels.closeAriaLabel}
							>
								<X className="h-4 w-4" aria-hidden />
							</Button>
						</div>
					</div>
				</DialogHeader>

				<div
					className="relative flex items-center justify-center bg-muted/30 flex-1 min-h-0 overflow-hidden touch-none"
					onWheel={handleWheel}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
					onTouchStart={(e) => {
						handleTouchStart(e);
						handleDoubleTap(e);
					}}
					onTouchMove={handleTouchMove}
					onTouchEnd={handleTouchEnd}
					style={{
						cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
					}}
				>
					{images.length > 1 && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="absolute left-2 sm:left-4 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
							onClick={handlePrev}
							aria-label={labels.prevImage}
						>
							<ChevronLeft className="h-6 w-6" aria-hidden />
						</Button>
					)}

					<div
						className="w-full h-full flex items-center justify-center p-4 sm:p-8 select-none"
						style={{
							transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
							transition: isDragging ? "none" : "transform 0.1s ease-out",
						}}
					>
						{/* eslint-disable-next-line @next/next/no-img-element -- blob URLs and remote URLs */}
						<img
							src={currentImage.src}
							alt={currentImage.title}
							className="max-w-full max-h-full object-contain pointer-events-none select-none"
							crossOrigin={crossOrigin}
						/>
					</div>

					{images.length > 1 && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="absolute right-2 sm:right-4 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
							onClick={handleNext}
							aria-label={labels.nextImage}
						>
							<ChevronRight className="h-6 w-6" aria-hidden />
						</Button>
					)}

					<div className="sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-1 backdrop-blur-sm">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-white hover:bg-white/20"
							onClick={handleZoomOut}
							disabled={zoom <= MIN_ZOOM}
							aria-label={labels.zoomOut}
						>
							<ZoomOut className="h-4 w-4" aria-hidden />
						</Button>
						<span className="text-xs text-white w-10 text-center tabular-nums">
							{Math.round(zoom * 100)}%
						</span>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-white hover:bg-white/20"
							onClick={handleZoomIn}
							disabled={zoom >= MAX_ZOOM}
							aria-label={labels.zoomIn}
						>
							<ZoomIn className="h-4 w-4" aria-hidden />
						</Button>
						{zoom !== 1 && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-white hover:bg-white/20"
								onClick={resetZoom}
								title={labels.resetZoom}
								aria-label={labels.resetZoom}
							>
								<RotateCcw className="h-3.5 w-3.5" aria-hidden />
							</Button>
						)}
					</div>

					{zoom === 1 && (
						<div className="sm:hidden absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/70 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
							{labels.pinchHint}
						</div>
					)}
				</div>

				{images.length > 1 && (
					<div className="p-4 border-t bg-muted/20">
						<div className="flex gap-2 overflow-x-auto">
							{images.map((image, index) => (
								<button
									key={`${image.src}-${index}`}
									type="button"
									onClick={() => setCurrentIndex(index)}
									className={cn(
										"relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all",
										currentIndex === index
											? "border-primary ring-2 ring-primary/20"
											: "border-transparent hover:border-muted-foreground/20",
									)}
								>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={image.src}
										alt=""
										className="w-full h-full object-contain"
										crossOrigin={
											image.src.startsWith("http://") ||
											image.src.startsWith("https://")
												? "anonymous"
												: undefined
										}
									/>
								</button>
							))}
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

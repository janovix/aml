/**
 * Document Viewer Dialog
 * Reusable dialog for viewing document images with gallery navigation and zoom
 */

"use client";

import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	ChevronLeft,
	ChevronRight,
	Download,
	X,
	ZoomIn,
	ZoomOut,
	RotateCcw,
} from "lucide-react";
import { PresignedImage } from "@/components/PresignedImage";
import { cn } from "@/lib/utils";

export interface DocumentImage {
	src: string;
	title: string;
}

interface DocumentViewerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	images: DocumentImage[];
	initialIndex?: number;
	originalFileUrl?: string | null;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.5;

export function DocumentViewerDialog({
	open,
	onOpenChange,
	images,
	initialIndex = 0,
	originalFileUrl,
}: DocumentViewerDialogProps) {
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [zoom, setZoom] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

	const containerRef = useRef<HTMLDivElement>(null);
	const imageContainerRef = useRef<HTMLDivElement>(null);

	// Touch state for pinch-to-zoom
	const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(
		null,
	);

	// Reset state when dialog opens or image changes
	useEffect(() => {
		if (open) {
			setCurrentIndex(initialIndex);
			resetZoom();
		}
	}, [open, initialIndex]);

	// Reset zoom when changing images
	useEffect(() => {
		resetZoom();
	}, [currentIndex]);

	const resetZoom = useCallback(() => {
		setZoom(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	const handleZoomIn = useCallback(() => {
		setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
	}, []);

	const handleZoomOut = useCallback(() => {
		setZoom((prev) => {
			const newZoom = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
			// Reset position if zooming back to 1
			if (newZoom === 1) {
				setPosition({ x: 0, y: 0 });
			}
			return newZoom;
		});
	}, []);

	// Mouse wheel zoom
	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			e.preventDefault();
			const delta = e.deltaY > 0 ? -ZOOM_STEP / 2 : ZOOM_STEP / 2;
			setZoom((prev) => {
				const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta));
				if (newZoom === 1) {
					setPosition({ x: 0, y: 0 });
				}
				return newZoom;
			});
		},
		[],
	);

	// Mouse drag for panning
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

	// Calculate distance between two touch points
	const getTouchDistance = (touches: React.TouchList): number => {
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	};

	// Touch handlers for pinch-to-zoom and pan
	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (e.touches.length === 2) {
				// Pinch start
				setLastTouchDistance(getTouchDistance(e.touches));
			} else if (e.touches.length === 1 && zoom > 1) {
				// Pan start
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
				// Pinch zoom
				e.preventDefault();
				const newDistance = getTouchDistance(e.touches);
				const scale = newDistance / lastTouchDistance;
				const newZoom = Math.max(
					MIN_ZOOM,
					Math.min(MAX_ZOOM, zoom * scale),
				);

				setZoom(newZoom);
				setLastTouchDistance(newDistance);

				if (newZoom === 1) {
					setPosition({ x: 0, y: 0 });
				}
			} else if (e.touches.length === 1 && isDragging && zoom > 1) {
				// Pan
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

	// Double tap to zoom
	const lastTapRef = useRef<number>(0);
	const handleDoubleTap = useCallback(
		(e: React.TouchEvent) => {
			const now = Date.now();
			if (now - lastTapRef.current < 300) {
				// Double tap detected
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

	if (!currentImage) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="h-dvh w-screen max-w-none max-h-none sm:h-auto sm:w-full sm:max-w-4xl sm:max-h-[calc(100vh-2rem)] p-0 gap-0 overflow-hidden rounded-none sm:rounded-lg top-0 left-0 translate-x-0 translate-y-0 sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]"
				showCloseButton={false}
			>
				<DialogHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
					<div className="flex items-center justify-between gap-3">
						<DialogTitle className="text-base sm:text-lg truncate">
							{currentImage.title}
						</DialogTitle>
						<div className="flex items-center gap-1 sm:gap-2 shrink-0">
							{images.length > 1 && (
								<span className="text-xs sm:text-sm text-muted-foreground mr-1">
									{currentIndex + 1} / {images.length}
								</span>
							)}

							{/* Zoom controls */}
							<div className="hidden sm:flex items-center gap-1 border rounded-lg p-0.5 bg-muted/30">
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7"
									onClick={handleZoomOut}
									disabled={zoom <= MIN_ZOOM}
								>
									<ZoomOut className="h-4 w-4" />
								</Button>
								<span className="text-xs w-12 text-center tabular-nums">
									{Math.round(zoom * 100)}%
								</span>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7"
									onClick={handleZoomIn}
									disabled={zoom >= MAX_ZOOM}
								>
									<ZoomIn className="h-4 w-4" />
								</Button>
								{zoom > 1 && (
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={resetZoom}
									>
										<RotateCcw className="h-3.5 w-3.5" />
									</Button>
								)}
							</div>

							{originalFileUrl && (
								<Button
									variant="outline"
									size="sm"
									className="h-8"
									onClick={() => window.open(originalFileUrl, "_blank")}
								>
									<Download className="h-4 w-4 sm:mr-2" />
									<span className="hidden sm:inline">PDF</span>
								</Button>
							)}
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 rounded-full"
								onClick={() => onOpenChange(false)}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</DialogHeader>

				{/* Image container with navigation */}
				<div
					ref={containerRef}
					className="relative flex items-center justify-center bg-muted/30 flex-1 sm:min-h-[70vh] overflow-hidden touch-none"
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
					style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
				>
					{/* Left arrow */}
					{images.length > 1 && (
						<Button
							variant="ghost"
							size="icon"
							className="absolute left-2 sm:left-4 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
							onClick={handlePrev}
						>
							<ChevronLeft className="h-6 w-6" />
						</Button>
					)}

					{/* Image with zoom and pan */}
					<div
						ref={imageContainerRef}
						className="w-full h-full flex items-center justify-center p-4 sm:p-8 select-none"
						style={{
							transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
							transition: isDragging ? "none" : "transform 0.1s ease-out",
						}}
					>
						<PresignedImage
							src={currentImage.src}
							alt={currentImage.title}
							className="max-w-full max-h-full object-contain pointer-events-none select-none"
						/>
					</div>

					{/* Right arrow */}
					{images.length > 1 && (
						<Button
							variant="ghost"
							size="icon"
							className="absolute right-2 sm:right-4 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
							onClick={handleNext}
						>
							<ChevronRight className="h-6 w-6" />
						</Button>
					)}

					{/* Mobile zoom controls (floating) */}
					<div className="sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-1 backdrop-blur-sm">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-white hover:bg-white/20"
							onClick={handleZoomOut}
							disabled={zoom <= MIN_ZOOM}
						>
							<ZoomOut className="h-4 w-4" />
						</Button>
						<span className="text-xs text-white w-10 text-center tabular-nums">
							{Math.round(zoom * 100)}%
						</span>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-white hover:bg-white/20"
							onClick={handleZoomIn}
							disabled={zoom >= MAX_ZOOM}
						>
							<ZoomIn className="h-4 w-4" />
						</Button>
						{zoom > 1 && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-white hover:bg-white/20"
								onClick={resetZoom}
							>
								<RotateCcw className="h-3.5 w-3.5" />
							</Button>
						)}
					</div>

					{/* Zoom hint for mobile */}
					{zoom === 1 && (
						<div className="sm:hidden absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/70 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
							Pellizca para zoom • Doble tap para ampliar
						</div>
					)}
				</div>

				{/* Thumbnail navigation (for multi-page documents) */}
				{images.length > 1 && (
					<div className="p-4 border-t bg-muted/20">
						<div className="flex gap-2 overflow-x-auto">
							{images.map((image, index) => (
								<button
									key={index}
									type="button"
									onClick={() => setCurrentIndex(index)}
									className={cn(
										"relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all",
										currentIndex === index
											? "border-primary ring-2 ring-primary/20"
											: "border-transparent hover:border-muted-foreground/20",
									)}
								>
									<PresignedImage
										src={image.src}
										alt={image.title}
										className="w-full h-full object-contain"
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

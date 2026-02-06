"use client";

import * as React from "react";
import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { CornerPoints, Point } from "@/lib/document-scanner/types";

interface ScannerCanvasProps {
	/** Source image to display */
	sourceCanvas: HTMLCanvasElement | null;
	/** Current corner points */
	corners: CornerPoints | null;
	/** Callback when corners are changed */
	onCornersChange?: (corners: CornerPoints) => void;
	/** Whether corner adjustment is enabled */
	adjustable?: boolean;
	/** Whether to show highlighted overlay */
	showHighlight?: boolean;
	/** Size of corner drag handles (default: responsive based on touch capability) */
	handleSize?: number;
	/** CSS class name */
	className?: string;
}

/**
 * Detect if device supports touch
 */
function isTouchDevice(): boolean {
	if (typeof window === "undefined") return false;
	return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Get the primary color from CSS variables
 */
function getPrimaryColor(): string {
	if (typeof window === "undefined") return "#8b5cf6"; // fallback purple
	const style = getComputedStyle(document.documentElement);
	const primary = style.getPropertyValue("--primary").trim();
	// oklch colors need to be converted or we use a fallback
	if (primary.startsWith("oklch")) {
		// Return a nice purple that matches the theme
		return "#8b5cf6";
	}
	return primary || "#8b5cf6";
}

type CornerKey = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

const CORNER_LABELS: Record<CornerKey, string> = {
	topLeft: "Superior Izquierda",
	topRight: "Superior Derecha",
	bottomLeft: "Inferior Izquierda",
	bottomRight: "Inferior Derecha",
};

export function ScannerCanvas({
	sourceCanvas,
	corners,
	onCornersChange,
	adjustable = true,
	showHighlight = false,
	handleSize: propHandleSize,
	className,
}: ScannerCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [scale, setScale] = useState(1);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [draggingCorner, setDraggingCorner] = useState<CornerKey | null>(null);
	const [hoveredCorner, setHoveredCorner] = useState<CornerKey | null>(null);
	const [primaryColor, setPrimaryColor] = useState("#8b5cf6");
	const [isTouch, setIsTouch] = useState(false);

	// Loupe state for magnifying glass during drag
	const [loupePosition, setLoupePosition] = useState<Point>({ x: 0, y: 0 });
	const [loupeCanvasPoint, setLoupeCanvasPoint] = useState<Point>({
		x: 0,
		y: 0,
	});

	// Responsive handle size - larger on touch devices
	const handleSize = propHandleSize ?? (isTouch ? 44 : 24);
	// Hit area is even larger for easier touch targeting
	const hitAreaMultiplier = isTouch ? 2.5 : 1.5;

	// Detect touch device
	useEffect(() => {
		setIsTouch(isTouchDevice());
	}, []);

	// Get primary color from theme
	useEffect(() => {
		setPrimaryColor(getPrimaryColor());
	}, []);

	// Calculate scale to fit canvas in container
	useEffect(() => {
		if (!containerRef.current || !sourceCanvas) return;

		const updateScale = () => {
			const container = containerRef.current;
			if (!container) return;

			const containerWidth = container.clientWidth;
			const containerHeight = container.clientHeight;

			const scaleX = containerWidth / sourceCanvas.width;
			const scaleY = containerHeight / sourceCanvas.height;
			const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up

			setScale(newScale);

			// Center the canvas
			const scaledWidth = sourceCanvas.width * newScale;
			const scaledHeight = sourceCanvas.height * newScale;
			setOffset({
				x: (containerWidth - scaledWidth) / 2,
				y: (containerHeight - scaledHeight) / 2,
			});
		};

		updateScale();

		const resizeObserver = new ResizeObserver(updateScale);
		resizeObserver.observe(containerRef.current);

		return () => resizeObserver.disconnect();
	}, [sourceCanvas]);

	// Draw canvas content
	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx || !sourceCanvas) return;

		// Set canvas size
		canvas.width = sourceCanvas.width;
		canvas.height = sourceCanvas.height;

		// Draw source image
		ctx.drawImage(sourceCanvas, 0, 0);

		// Draw highlight overlay if enabled (like jscanify - colored overlay ON the document)
		if (showHighlight && corners) {
			// Draw semi-transparent colored overlay ON the document area
			// Use rgba format for reliable transparency
			ctx.fillStyle = "rgba(139, 92, 246, 0.3)"; // Purple with 30% opacity
			ctx.beginPath();
			ctx.moveTo(corners.topLeft.x, corners.topLeft.y);
			ctx.lineTo(corners.topRight.x, corners.topRight.y);
			ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y);
			ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y);
			ctx.closePath();
			ctx.fill();

			// Draw thick border around the document
			ctx.strokeStyle = primaryColor;
			ctx.lineWidth = 8;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.beginPath();
			ctx.moveTo(corners.topLeft.x, corners.topLeft.y);
			ctx.lineTo(corners.topRight.x, corners.topRight.y);
			ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y);
			ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y);
			ctx.closePath();
			ctx.stroke();
		}

		// Draw corner lines and handles if corners exist (only when not in highlight mode)
		if (corners && !showHighlight) {
			const cornerKeys: CornerKey[] = [
				"topLeft",
				"topRight",
				"bottomRight",
				"bottomLeft",
			];

			// Draw connecting lines with primary color
			ctx.strokeStyle = primaryColor;
			ctx.lineWidth = 2;
			ctx.setLineDash([]);
			ctx.beginPath();
			ctx.moveTo(corners.topLeft.x, corners.topLeft.y);
			ctx.lineTo(corners.topRight.x, corners.topRight.y);
			ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y);
			ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y);
			ctx.closePath();
			ctx.stroke();

			// Draw corner handles (only if adjustable)
			if (adjustable) {
				cornerKeys.forEach((key) => {
					const point = corners[key];
					const isHovered = hoveredCorner === key;
					const isDragging = draggingCorner === key;

					// Outer circle (handle background)
					ctx.beginPath();
					ctx.arc(point.x, point.y, handleSize / 2, 0, Math.PI * 2);
					ctx.fillStyle =
						isDragging || isHovered ? primaryColor : "rgba(255, 255, 255, 0.9)";
					ctx.fill();
					ctx.strokeStyle = primaryColor;
					ctx.lineWidth = 2;
					ctx.stroke();

					// Inner dot
					ctx.beginPath();
					ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
					ctx.fillStyle = isDragging || isHovered ? "white" : primaryColor;
					ctx.fill();
				});
			}
		}
	}, [
		sourceCanvas,
		corners,
		showHighlight,
		primaryColor,
		handleSize,
		hoveredCorner,
		draggingCorner,
		adjustable,
	]);

	// Convert screen coordinates to canvas coordinates
	const screenToCanvas = useCallback(
		(screenX: number, screenY: number): Point => {
			const container = containerRef.current;
			if (!container) return { x: 0, y: 0 };

			const rect = container.getBoundingClientRect();
			return {
				x: (screenX - rect.left - offset.x) / scale,
				y: (screenY - rect.top - offset.y) / scale,
			};
		},
		[scale, offset],
	);

	// Find which corner (if any) is at the given canvas coordinates
	const findCornerAtPoint = useCallback(
		(point: Point): CornerKey | null => {
			if (!corners) return null;

			const cornerKeys: CornerKey[] = [
				"topLeft",
				"topRight",
				"bottomLeft",
				"bottomRight",
			];

			for (const key of cornerKeys) {
				const corner = corners[key];
				const distance = Math.sqrt(
					Math.pow(point.x - corner.x, 2) + Math.pow(point.y - corner.y, 2),
				);
				// Increase hit area for easier grabbing (larger on touch devices)
				if (distance <= (handleSize / 2) * hitAreaMultiplier) {
					return key;
				}
			}

			return null;
		},
		[corners, handleSize, hitAreaMultiplier],
	);

	// Mouse event handlers
	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			const canvasPoint = screenToCanvas(e.clientX, e.clientY);

			if (draggingCorner && corners && onCornersChange) {
				// Constrain to canvas bounds
				const clampedX = Math.max(
					0,
					Math.min(sourceCanvas?.width || 0, canvasPoint.x),
				);
				const clampedY = Math.max(
					0,
					Math.min(sourceCanvas?.height || 0, canvasPoint.y),
				);

				onCornersChange({
					...corners,
					[draggingCorner]: { x: clampedX, y: clampedY },
				});

				// Update loupe position
				setLoupePosition({ x: e.clientX, y: e.clientY });
				setLoupeCanvasPoint(canvasPoint);
			} else if (adjustable) {
				const corner = findCornerAtPoint(canvasPoint);
				setHoveredCorner(corner);
			}
		},
		[
			screenToCanvas,
			draggingCorner,
			corners,
			onCornersChange,
			adjustable,
			findCornerAtPoint,
			sourceCanvas,
		],
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (!adjustable) return;

			const canvasPoint = screenToCanvas(e.clientX, e.clientY);
			const corner = findCornerAtPoint(canvasPoint);

			if (corner) {
				setDraggingCorner(corner);
				// Initialize loupe position
				setLoupePosition({ x: e.clientX, y: e.clientY });
				setLoupeCanvasPoint(canvasPoint);
				e.preventDefault();
			}
		},
		[adjustable, screenToCanvas, findCornerAtPoint],
	);

	const handleMouseUp = useCallback(() => {
		setDraggingCorner(null);
	}, []);

	const handleMouseLeave = useCallback(() => {
		setHoveredCorner(null);
		setDraggingCorner(null);
	}, []);

	// Touch event handlers for mobile
	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (!adjustable || e.touches.length !== 1) return;

			const touch = e.touches[0];
			const canvasPoint = screenToCanvas(touch.clientX, touch.clientY);
			const corner = findCornerAtPoint(canvasPoint);

			if (corner) {
				setDraggingCorner(corner);
				setHoveredCorner(corner);
				// Initialize loupe position
				setLoupePosition({ x: touch.clientX, y: touch.clientY });
				setLoupeCanvasPoint(canvasPoint);
				e.preventDefault(); // Prevent scrolling when dragging
			}
		},
		[adjustable, screenToCanvas, findCornerAtPoint],
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (!draggingCorner || !corners || !onCornersChange) return;
			if (e.touches.length !== 1) return;

			e.preventDefault(); // Prevent scrolling

			const touch = e.touches[0];
			const canvasPoint = screenToCanvas(touch.clientX, touch.clientY);

			// Constrain to canvas bounds
			const clampedX = Math.max(
				0,
				Math.min(sourceCanvas?.width || 0, canvasPoint.x),
			);
			const clampedY = Math.max(
				0,
				Math.min(sourceCanvas?.height || 0, canvasPoint.y),
			);

			onCornersChange({
				...corners,
				[draggingCorner]: { x: clampedX, y: clampedY },
			});

			// Update loupe position
			setLoupePosition({ x: touch.clientX, y: touch.clientY });
			setLoupeCanvasPoint(canvasPoint);
		},
		[draggingCorner, corners, onCornersChange, screenToCanvas, sourceCanvas],
	);

	const handleTouchEnd = useCallback(() => {
		setDraggingCorner(null);
		setHoveredCorner(null);
	}, []);

	if (!sourceCanvas) {
		return (
			<div
				className={cn(
					"flex items-center justify-center bg-muted/30 rounded-lg",
					className,
				)}
			>
				<p className="text-muted-foreground text-sm">No hay imagen cargada</p>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className={cn(
				"relative overflow-hidden bg-black/90 rounded-lg touch-none",
				adjustable && "cursor-crosshair",
				draggingCorner && "cursor-grabbing",
				className,
			)}
			// Mouse events
			onMouseMove={handleMouseMove}
			onMouseDown={handleMouseDown}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseLeave}
			// Touch events
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			onTouchCancel={handleTouchEnd}
		>
			<canvas
				ref={canvasRef}
				style={{
					transform: `scale(${scale})`,
					transformOrigin: "top left",
					marginLeft: offset.x,
					marginTop: offset.y,
				}}
			/>

			{/* Corner label tooltip */}
			{hoveredCorner && corners && (
				<div
					className="absolute bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none z-10"
					style={{
						left: corners[hoveredCorner].x * scale + offset.x + 20,
						top: corners[hoveredCorner].y * scale + offset.y - 10,
					}}
				>
					{CORNER_LABELS[hoveredCorner]}
				</div>
			)}

			{/* Instructions overlay */}
			{adjustable && !draggingCorner && (
				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs sm:text-sm px-3 py-2 rounded-full text-center max-w-[90%]">
					{isTouch
						? "Toca y arrastra los puntos para ajustar"
						: "Arrastra las esquinas para ajustar el área del documento"}
				</div>
			)}

			{/* Magnifying Glass Loupe */}
			{draggingCorner &&
				sourceCanvas &&
				containerRef.current &&
				(() => {
					const containerRect = containerRef.current.getBoundingClientRect();
					const loupeSize = 120;
					const loupeOffset = 30; // Gap between loupe and touch point

					// Calculate position relative to container
					const relativeX = loupePosition.x - containerRect.left;
					const relativeY = loupePosition.y - containerRect.top;

					// Check if there's enough room above for the loupe
					const roomAbove = relativeY - loupeOffset - loupeSize;
					const showBelow = roomAbove < 0;

					// Calculate final position
					const left = relativeX - loupeSize / 2;
					const top = showBelow
						? relativeY + loupeOffset // Show below touch point
						: relativeY - loupeSize - loupeOffset; // Show above touch point

					return (
						<div
							className="absolute pointer-events-none z-50"
							style={{
								left,
								top,
								width: loupeSize,
								height: loupeSize,
							}}
						>
							<div
								className="relative w-full h-full rounded-full overflow-hidden border-4 shadow-2xl"
								style={{
									borderColor: primaryColor,
									backgroundColor: "#000",
								}}
							>
								<div
									className="absolute"
									style={{
										width: sourceCanvas.width * 1.5,
										height: sourceCanvas.height * 1.5,
										left: loupeSize / 2 - loupeCanvasPoint.x * 1.5,
										top: loupeSize / 2 - loupeCanvasPoint.y * 1.5,
									}}
								>
									<canvas
										ref={(el) => {
											if (el && sourceCanvas) {
												el.width = sourceCanvas.width;
												el.height = sourceCanvas.height;
												const ctx = el.getContext("2d");
												if (ctx) {
													ctx.drawImage(sourceCanvas, 0, 0);
												}
											}
										}}
										style={{
											width: sourceCanvas.width * 1.5,
											height: sourceCanvas.height * 1.5,
										}}
									/>
								</div>
								{/* Crosshair overlay */}
								<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
									<div className="w-6 h-0.5 bg-white/70" />
								</div>
								<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
									<div className="w-0.5 h-6 bg-white/70" />
								</div>
								<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
									<div
										className="w-2 h-2 rounded-full"
										style={{ backgroundColor: primaryColor }}
									/>
								</div>
							</div>
							{/* Arrow pointing to touch point */}
							<div
								className={`absolute left-1/2 -translate-x-1/2 ${showBelow ? "-top-2" : "-bottom-2"} w-0 h-0`}
								style={{
									borderLeft: "8px solid transparent",
									borderRight: "8px solid transparent",
									...(showBelow
										? { borderBottom: `8px solid ${primaryColor}` }
										: { borderTop: `8px solid ${primaryColor}` }),
								}}
							/>
						</div>
					);
				})()}
		</div>
	);
}

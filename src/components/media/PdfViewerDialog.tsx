"use client";

/**
 * In-app PDF viewer dialog using pdfjs-dist (same stack as training / rasterizer).
 * Kept in AML because @algenium/blocks does not ship PdfViewerDialog in current releases.
 */

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export type PdfViewerDialogLabels = {
	loading: string;
	close: string;
	/** Visible dialog title (falls back to `title`) */
	dialogTitle?: string;
};

export interface PdfViewerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	src: ArrayBuffer | Uint8Array | string;
	workerSrc: string;
	title?: string;
	labels: PdfViewerDialogLabels;
}

type Phase = "idle" | "loading" | "ready" | "error";

export function PdfViewerDialog({
	open,
	onOpenChange,
	src,
	workerSrc,
	title,
	labels,
}: PdfViewerDialogProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [phase, setPhase] = useState<Phase>("idle");
	const docRef = useRef<{ destroy?: () => Promise<void> } | null>(null);

	useEffect(() => {
		if (!open) {
			setPhase("idle");
			return;
		}

		const container = containerRef.current;
		if (!container) return;

		let cancelled = false;
		setPhase("loading");
		container.replaceChildren();

		void (async () => {
			try {
				const pdfjs = await import("pdfjs-dist");
				pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

				const init =
					typeof src === "string"
						? { url: src }
						: { data: src instanceof Uint8Array ? src : new Uint8Array(src) };

				const pdf = await pdfjs.getDocument(init).promise;
				if (cancelled) {
					await pdf.destroy().catch(() => {});
					return;
				}
				docRef.current = pdf;

				const scale = 1.25;
				for (let p = 1; p <= pdf.numPages; p++) {
					if (cancelled) break;
					const page = await pdf.getPage(p);
					const viewport = page.getViewport({ scale });
					const canvas = document.createElement("canvas");
					if (!canvas.getContext("2d")) continue;
					canvas.width = viewport.width;
					canvas.height = viewport.height;
					canvas.className =
						"mx-auto mb-4 block max-h-[85vh] max-w-full rounded border bg-background shadow-sm";
					await page.render({ canvas, viewport }).promise;
					container.appendChild(canvas);
				}

				if (!cancelled) setPhase("ready");
			} catch {
				if (!cancelled) setPhase("error");
			}
		})();

		return () => {
			cancelled = true;
			const doc = docRef.current;
			docRef.current = null;
			void doc?.destroy?.();
		};
	}, [open, src, workerSrc]);

	const heading = labels.dialogTitle ?? title ?? "PDF";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-2 overflow-hidden">
				<DialogHeader className="shrink-0">
					<DialogTitle>{heading}</DialogTitle>
				</DialogHeader>
				<div className="flex shrink-0 justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						{labels.close}
					</Button>
				</div>
				<div className="relative min-h-[240px] flex-1 overflow-y-auto rounded-md border bg-muted/20 p-2">
					{phase === "loading" ? (
						<div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
							<p className="text-muted-foreground text-center text-sm">
								{labels.loading}
							</p>
						</div>
					) : null}
					{phase === "error" ? (
						<div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
							<p className="text-destructive text-center text-sm">
								Could not load this PDF.
							</p>
						</div>
					) : null}
					<div ref={containerRef} />
				</div>
			</DialogContent>
		</Dialog>
	);
}

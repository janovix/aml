// Use dynamic imports to prevent SSR issues with canvas-dependent code
import dynamic from "next/dynamic";

export const DocumentScannerModal = dynamic(
	() =>
		import("./DocumentScannerModal").then((mod) => mod.DocumentScannerModal),
	{ ssr: false },
);

export const ScannerCanvas = dynamic(
	() => import("./ScannerCanvas").then((mod) => mod.ScannerCanvas),
	{ ssr: false },
);

export { ScannerSteps } from "./ScannerSteps";
export { MobileUploadQR, MobileUploadTrigger } from "./MobileUploadQR";

// Export types
export type {
	INEExtractionData,
	DocumentExtractionData,
} from "./DocumentScannerModal";

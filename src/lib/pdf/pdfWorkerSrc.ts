/** Bundler-resolved PDF.js worker URL (must match the app's `pdfjs-dist` version). */
export const PDF_JS_WORKER_SRC = new URL(
	"pdfjs-dist/build/pdf.worker.min.mjs",
	import.meta.url,
).toString();

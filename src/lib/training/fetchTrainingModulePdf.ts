import { getDataEnvironment } from "@/lib/environment-store";

function isClientSide(): boolean {
	return typeof window !== "undefined";
}

function isTestEnvironment(): boolean {
	return (
		typeof process !== "undefined" &&
		(process.env.NODE_ENV === "test" ||
			process.env.VITEST === "true" ||
			process.env.JEST_WORKER_ID !== undefined)
	);
}

async function getJwtIfNeeded(): Promise<string | null> {
	if (isTestEnvironment() || !isClientSide()) return null;
	try {
		const { tokenCache } = await import("@/lib/auth/tokenCache");
		return await tokenCache.getCachedToken();
	} catch {
		return null;
	}
}

/** @internal */
export const PDF_SESSION_EXPIRED = "PDF_SESSION_EXPIRED";
/** @internal */
export const PDF_FETCH_FAILED = "PDF_FETCH_FAILED";
/** @internal */
export const PDF_INVALID_CONTENT_TYPE = "PDF_INVALID_CONTENT_TYPE";

/**
 * Fetches a training module PDF into memory with Bearer + environment headers.
 * Does not log tokens, URLs, or buffer contents.
 */
export async function fetchTrainingModulePdfBuffer(
	absoluteAssetUrl: string,
	signal: AbortSignal,
): Promise<ArrayBuffer> {
	if (signal.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}

	const jwt = await getJwtIfNeeded();

	const headers: Record<string, string> = {
		Accept: "application/pdf",
	};

	if (jwt) {
		headers.Authorization = `Bearer ${jwt}`;
	}

	if (isClientSide() && !isTestEnvironment()) {
		headers["X-Environment"] = getDataEnvironment();
	}

	const res = await fetch(absoluteAssetUrl, {
		method: "GET",
		signal,
		cache: "no-store",
		headers,
	});

	if (!res.ok) {
		if (res.status === 401 || res.status === 403) {
			throw new Error(PDF_SESSION_EXPIRED);
		}
		throw new Error(PDF_FETCH_FAILED);
	}

	const contentType = res.headers.get("Content-Type") ?? "";
	if (!contentType.startsWith("application/pdf")) {
		throw new Error(PDF_INVALID_CONTENT_TYPE);
	}

	return res.arrayBuffer();
}

export function mapTrainingModulePdfError(
	error: unknown,
): "trainingPdfSessionExpired" | "trainingPdfLoadFailed" {
	if (error instanceof DOMException && error.name === "AbortError") {
		return "trainingPdfLoadFailed";
	}
	if (error instanceof Error && error.message === PDF_SESSION_EXPIRED) {
		return "trainingPdfSessionExpired";
	}
	return "trainingPdfLoadFailed";
}

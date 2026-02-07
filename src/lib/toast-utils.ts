import { toast } from "sonner";
import { extractErrorMessage } from "./mutations";

/**
 * Minimum interval (ms) between showing the same toast ID.
 * Prevents toast spam from fetch retry loops.
 */
const DEDUP_WINDOW_MS = 5_000;

const lastShownAt = new Map<string, number>();

/**
 * Show a data-loading error toast with deduplication.
 *
 * Uses Sonner's `id` option so the same toast is **replaced** (not stacked),
 * and additionally skips the call entirely if the same ID was shown within
 * the last {@link DEDUP_WINDOW_MS} milliseconds.
 *
 * Usage:
 * ```ts
 * catch (error) {
 *   showFetchError("operations-table", error);
 * }
 * ```
 */
export function showFetchError(id: string, error: unknown): void {
	const now = Date.now();
	const prev = lastShownAt.get(id);

	if (prev && now - prev < DEDUP_WINDOW_MS) {
		// Already shown recently – skip to avoid spam
		return;
	}

	lastShownAt.set(id, now);
	toast.error(extractErrorMessage(error), { id });
}

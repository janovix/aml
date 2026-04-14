import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const fetchWatchlistConfig = vi.fn();
vi.mock("@/lib/api/watchlist", () => ({
	fetchWatchlistConfig: () => fetchWatchlistConfig(),
}));

describe("useWatchlistConfig", () => {
	beforeEach(() => {
		vi.resetModules();
		fetchWatchlistConfig.mockReset();
	});

	it("loads features from API", async () => {
		fetchWatchlistConfig.mockResolvedValue({
			pepSearch: false,
			pepGrok: true,
			adverseMedia: false,
		});

		const { useWatchlistConfig } = await import("./useWatchlistConfig");
		const { result } = renderHook(() => useWatchlistConfig());

		expect(result.current.isLoading).toBe(true);
		expect(result.current.features.pepSearch).toBe(true);

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.features.pepSearch).toBe(false);
		expect(fetchWatchlistConfig).toHaveBeenCalled();
	});
});

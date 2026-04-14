import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useWatchlistScreening } from "./useWatchlistScreening";
import type { WatchlistQueryResult } from "@/lib/api/watchlist";

const getQueryResults = vi.fn();
vi.mock("@/lib/api/watchlist", () => ({
	getQueryResults: (...a: unknown[]) => getQueryResults(...a),
}));

vi.mock("@/lib/api/config", () => ({
	getWatchlistBaseUrl: () => "https://wl.test",
}));

vi.mock("@/lib/auth/tokenCache", () => ({
	tokenCache: { getCachedToken: vi.fn().mockResolvedValue(null) },
}));

function completeResult(id: string): WatchlistQueryResult {
	return {
		id,
		organizationId: "o1",
		userId: "u1",
		query: "q",
		source: "manual",
		entityType: "person",
		birthDate: null,
		countries: null,
		status: "completed",
		ofacStatus: "completed",
		ofacResult: null,
		ofacCount: 0,
		sat69bStatus: "completed",
		sat69bResult: null,
		sat69bCount: 0,
		unStatus: "completed",
		unResult: null,
		unCount: 0,
		pepOfficialStatus: "completed",
		pepOfficialResult: null,
		pepOfficialCount: 0,
		pepAiStatus: "completed",
		pepAiResult: null,
		adverseMediaStatus: "completed",
		adverseMediaResult: null,
		createdAt: "t",
		updatedAt: "t",
	};
}

describe("useWatchlistScreening", () => {
	let OriginalEventSource: typeof EventSource;

	beforeEach(() => {
		getQueryResults.mockReset();
		OriginalEventSource = globalThis.EventSource;
		globalThis.EventSource = class MockES {
			url: string;
			private readonly listeners = new Map<
				string,
				Set<(ev: MessageEvent) => void>
			>();
			onopen: ((ev: Event) => void) | null = null;
			onmessage: ((ev: MessageEvent) => void) | null = null;
			onerror: ((ev: Event) => void) | null = null;
			close = vi.fn();
			constructor(url: string) {
				this.url = url;
				queueMicrotask(() => this.onopen?.(new Event("open")));
			}
			addEventListener(type: string, fn: EventListener) {
				if (!this.listeners.has(type)) this.listeners.set(type, new Set());
				this.listeners.get(type)!.add(fn as (ev: MessageEvent) => void);
			}
			removeEventListener(type: string, fn: EventListener) {
				this.listeners.get(type)?.delete(fn as (ev: MessageEvent) => void);
			}
			emit(type: string, data: unknown) {
				const ev = { data: JSON.stringify(data) } as MessageEvent;
				this.listeners.get(type)?.forEach((h) => h(ev));
			}
		} as unknown as typeof EventSource;
	});

	afterEach(() => {
		globalThis.EventSource = OriginalEventSource;
	});

	it("does not fetch when watchlistQueryId is null", () => {
		const { result } = renderHook(() =>
			useWatchlistScreening({ watchlistQueryId: null }),
		);
		expect(getQueryResults).not.toHaveBeenCalled();
		expect(result.current.data).toBeNull();
	});

	it("fetches query results when id is set", async () => {
		getQueryResults.mockResolvedValue(completeResult("q1"));

		const { result } = renderHook(() =>
			useWatchlistScreening({ watchlistQueryId: "q1" }),
		);

		await waitFor(() => expect(getQueryResults).toHaveBeenCalledWith("q1"));
		await waitFor(() => expect(result.current.data?.id).toBe("q1"));
	});
});

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { WatchlistScreeningSection } from "./WatchlistScreeningSection";
import { renderWithProviders } from "@/lib/testHelpers";

vi.mock("@/hooks/useWatchlistScreening", () => ({
	useWatchlistScreening: () => ({
		data: null,
		isLoading: true,
		error: null,
		connectionStatus: "disconnected",
		isComplete: false,
		refetch: vi.fn(),
	}),
}));

vi.mock("@/hooks/useWatchlistConfig", () => ({
	useWatchlistConfig: () => ({
		features: {
			pepSearch: true,
			pepGrok: false,
			adverseMedia: true,
		},
		isLoading: false,
	}),
}));

vi.mock("@/lib/api/config", () => ({
	getWatchlistBaseUrl: () => "https://wl.example",
}));

describe("WatchlistScreeningSection", () => {
	it("shows loading state while screening hook loads", () => {
		renderWithProviders(
			<WatchlistScreeningSection watchlistQueryId="wl-query-1" />,
		);
		expect(screen.getByText("Watchlist Screening")).toBeInTheDocument();
		expect(document.querySelector(".animate-spin")).toBeTruthy();
	});
});

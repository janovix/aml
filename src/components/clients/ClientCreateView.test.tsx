import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { ClientCreateView } from "./ClientCreateView";
import { renderWithProviders } from "@/lib/testHelpers";

// Mock cookies module to return Spanish language for tests
vi.mock("@/lib/cookies", () => ({
	getCookie: (name: string) => {
		if (name === "janovix-lang") return "es";
		return undefined;
	},
	setCookie: vi.fn(),
	deleteCookie: vi.fn(),
	COOKIE_NAMES: {
		THEME: "janovix-theme",
		LANGUAGE: "janovix-lang",
	},
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
	usePathname: () => "/test-org/clients/new",
	useSearchParams: () => ({
		get: () => null,
	}),
	useParams: () => ({ orgSlug: "test-org" }),
}));

describe("ClientCreateView", () => {
	it("renders create client header and submit button", () => {
		renderWithProviders(<ClientCreateView />);

		expect(screen.getByText("Nuevo Cliente")).toBeInTheDocument();
		expect(
			screen.getAllByRole("button", { name: /crear cliente/i }).length,
		).toBeGreaterThan(0);
	});
});

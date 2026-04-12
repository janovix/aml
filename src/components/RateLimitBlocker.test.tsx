import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { RateLimitBlocker } from "./RateLimitBlocker";
import { LanguageProvider } from "@/components/LanguageProvider";
import { AUTH_RATE_LIMIT_EVENT } from "@/lib/auth/authClient";

describe("RateLimitBlocker", () => {
	const assignSpy = vi.fn();

	beforeEach(() => {
		vi.spyOn(window, "location", "get").mockReturnValue({
			...window.location,
			href: "https://app.example/current",
			assign: assignSpy,
		} as Location);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renders nothing until rate limit event", () => {
		const { container } = render(
			<LanguageProvider defaultLanguage="es">
				<RateLimitBlocker />
			</LanguageProvider>,
		);
		expect(container.querySelector('[class*="fixed"]')).toBeNull();
	});

	it("shows title after rate limit event with retryAfter 0", async () => {
		render(
			<LanguageProvider defaultLanguage="es">
				<RateLimitBlocker />
			</LanguageProvider>,
		);

		window.dispatchEvent(
			new CustomEvent(AUTH_RATE_LIMIT_EVENT, {
				detail: { retryAfter: 0 },
			}),
		);

		await waitFor(() => {
			expect(screen.getByText("Demasiadas solicitudes")).toBeInTheDocument();
		});
		expect(
			screen.getByRole("button", { name: "Reintentar" }),
		).not.toBeDisabled();
	});
});

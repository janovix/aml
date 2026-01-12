import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	getUserSettings,
	updateUserSettings,
	getResolvedSettings,
} from "./settingsClient";

// Mock the auth config
vi.mock("../auth/config", () => ({
	getAuthServiceUrl: () => "https://auth-svc.test",
}));

describe("settingsClient", () => {
	const originalFetch = global.fetch;
	const originalNavigator = global.navigator;
	const originalWindow = global.window;

	beforeEach(() => {
		// Mock fetch
		global.fetch = vi.fn();

		// Mock navigator
		Object.defineProperty(global, "navigator", {
			value: {
				language: "en-US",
			},
			writable: true,
			configurable: true,
		});

		// Mock window
		Object.defineProperty(global, "window", {
			value: {
				matchMedia: vi.fn().mockReturnValue({ matches: false }),
			},
			writable: true,
			configurable: true,
		});

		// Mock Intl.DateTimeFormat
		vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
			return {
				resolvedOptions: () => ({ timeZone: "America/New_York" }),
			} as unknown as Intl.DateTimeFormat;
		});
	});

	afterEach(() => {
		global.fetch = originalFetch;
		Object.defineProperty(global, "navigator", {
			value: originalNavigator,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(global, "window", {
			value: originalWindow,
			writable: true,
			configurable: true,
		});
		vi.restoreAllMocks();
	});

	describe("getUserSettings", () => {
		it("fetches user settings successfully", async () => {
			const mockSettings = {
				id: "user-123",
				userId: "user-123",
				theme: "dark" as const,
				language: "en" as const,
				timezone: "America/New_York",
				dateFormat: "MM/DD/YYYY" as const,
			};

			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ data: mockSettings }),
			} as Response);

			const result = await getUserSettings();

			expect(global.fetch).toHaveBeenCalledWith(
				"https://auth-svc.test/api/settings/user",
				{ credentials: "include" },
			);
			expect(result).toEqual(mockSettings);
		});

		it("throws error when fetch fails", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: false,
			} as Response);

			await expect(getUserSettings()).rejects.toThrow(
				"Failed to fetch user settings",
			);
		});
	});

	describe("updateUserSettings", () => {
		it("updates user settings successfully", async () => {
			const input = { theme: "dark" as const };
			const mockUpdatedSettings = {
				id: "user-123",
				userId: "user-123",
				theme: "dark" as const,
				language: "en" as const,
				timezone: "America/New_York",
				dateFormat: "MM/DD/YYYY" as const,
			};

			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ data: mockUpdatedSettings }),
			} as Response);

			const result = await updateUserSettings(input);

			expect(global.fetch).toHaveBeenCalledWith(
				"https://auth-svc.test/api/settings/user",
				{
					method: "PATCH",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(input),
				},
			);
			expect(result).toEqual(mockUpdatedSettings);
		});

		it("throws error with message from response", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: "Custom error message" }),
			} as Response);

			await expect(updateUserSettings({ theme: "dark" })).rejects.toThrow(
				"Custom error message",
			);
		});

		it("throws default error when response has no error message", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: false,
				json: async () => ({}),
			} as Response);

			await expect(updateUserSettings({ theme: "dark" })).rejects.toThrow(
				"Failed to update user settings",
			);
		});

		it("throws default error when json parsing fails", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: false,
				json: async () => {
					throw new Error("Invalid JSON");
				},
			} as unknown as Response);

			await expect(updateUserSettings({ theme: "dark" })).rejects.toThrow(
				"Unknown error",
			);
		});
	});

	describe("getResolvedSettings", () => {
		it("fetches resolved settings successfully", async () => {
			const mockResolvedSettings = {
				theme: "dark" as const,
				language: "en" as const,
				timezone: "America/New_York",
				dateFormat: "MM/DD/YYYY" as const,
			};

			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ data: mockResolvedSettings }),
			} as Response);

			const result = await getResolvedSettings();

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("https://auth-svc.test/api/settings/resolved"),
				{ credentials: "include" },
			);
			expect(result).toEqual(mockResolvedSettings);
		});

		it("includes browser hints in request", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					data: {
						theme: "light" as const,
						language: "en" as const,
						timezone: "America/New_York",
						dateFormat: "MM/DD/YYYY" as const,
					},
				}),
			} as Response);

			await getResolvedSettings();

			const fetchCall = vi.mocked(global.fetch).mock.calls[0];
			const url = fetchCall[0] as string;

			expect(url).toContain("headers=");
			// Decode the headers parameter
			const headersParam = new URL(url).searchParams.get("headers");
			expect(headersParam).toBeTruthy();
			const decodedHeaders = JSON.parse(atob(headersParam!));
			expect(decodedHeaders["accept-language"]).toBe("en-US");
			expect(decodedHeaders["x-timezone"]).toBe("America/New_York");
			expect(decodedHeaders["x-preferred-theme"]).toBe("light");
		});

		it("throws error when fetch fails", async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: false,
			} as Response);

			await expect(getResolvedSettings()).rejects.toThrow(
				"Failed to fetch resolved settings",
			);
		});

		it("detects dark mode preference", async () => {
			Object.defineProperty(global, "window", {
				value: {
					matchMedia: vi.fn().mockReturnValue({ matches: true }),
				},
				writable: true,
				configurable: true,
			});

			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					data: {
						theme: "dark" as const,
						language: "en" as const,
						timezone: "America/New_York",
						dateFormat: "MM/DD/YYYY" as const,
					},
				}),
			} as Response);

			await getResolvedSettings();

			const fetchCall = vi.mocked(global.fetch).mock.calls[0];
			const url = fetchCall[0] as string;
			const headersParam = new URL(url).searchParams.get("headers");
			const decodedHeaders = JSON.parse(atob(headersParam!));
			expect(decodedHeaders["x-preferred-theme"]).toBe("dark");
		});
	});
});

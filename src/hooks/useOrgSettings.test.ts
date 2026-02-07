import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useOrgSettings } from "./useOrgSettings";
import type { OrganizationSettingsEntity } from "@/lib/api/organization-settings";

// Mock dependencies
vi.mock("@/lib/org-store", () => ({
	useOrgStore: vi.fn(() => ({
		currentOrg: { id: "org-1", name: "Test Org", slug: "test-org" },
	})),
}));

vi.mock("@/hooks/useJwt", () => ({
	useJwt: vi.fn(() => ({ jwt: "mock-jwt-token", isLoading: false })),
}));

const mockGetOrganizationSettings = vi.fn();
vi.mock("@/lib/api/organization-settings", () => ({
	getOrganizationSettings: (...args: unknown[]) =>
		mockGetOrganizationSettings(...args),
}));

const mockSettings: OrganizationSettingsEntity = {
	id: "settings-1",
	organizationId: "org-1",
	obligatedSubjectKey: "SO-VEH",
	activityKey: "VEH",
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
};

describe("useOrgSettings", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("fetches settings and returns them", async () => {
		mockGetOrganizationSettings.mockResolvedValue(mockSettings);

		const { result } = renderHook(() => useOrgSettings());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.settings).toEqual(mockSettings);
		expect(result.current.activityCode).toBe("VEH");
		expect(result.current.isConfigured).toBe(true);
		expect(result.current.error).toBeNull();
	});

	it("sets isConfigured to false when activityKey is missing", async () => {
		mockGetOrganizationSettings.mockResolvedValue({
			...mockSettings,
			activityKey: "",
			obligatedSubjectKey: "",
		});

		const { result } = renderHook(() => useOrgSettings());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.isConfigured).toBe(false);
		// activityKey is empty string, which casts to "" as ActivityCode, not null
		expect(result.current.activityCode).toBeFalsy();
	});

	it("handles API errors", async () => {
		mockGetOrganizationSettings.mockRejectedValue(new Error("Network error"));

		const { result } = renderHook(() => useOrgSettings());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.error).toBe("Network error");
		expect(result.current.settings).toBeNull();
	});

	it("handles non-Error thrown values", async () => {
		mockGetOrganizationSettings.mockRejectedValue("string error");

		const { result } = renderHook(() => useOrgSettings());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.error).toBe("Error al cargar configuración");
	});

	it("does not fetch when JWT is missing", async () => {
		const { useJwt } = await import("@/hooks/useJwt");
		vi.mocked(useJwt).mockReturnValue({
			jwt: null,
			isLoading: false,
		} as ReturnType<typeof useJwt>);

		const { result } = renderHook(() => useOrgSettings());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(mockGetOrganizationSettings).not.toHaveBeenCalled();
	});

	it("does not fetch when org is missing", async () => {
		const { useOrgStore } = await import("@/lib/org-store");
		vi.mocked(useOrgStore).mockReturnValue({
			currentOrg: null,
		} as ReturnType<typeof useOrgStore>);

		const { result } = renderHook(() => useOrgSettings());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(mockGetOrganizationSettings).not.toHaveBeenCalled();
	});

	it("returns isLoading true while JWT is loading", async () => {
		const { useJwt } = await import("@/hooks/useJwt");
		vi.mocked(useJwt).mockReturnValue({
			jwt: null,
			isLoading: true,
		} as ReturnType<typeof useJwt>);

		const { result } = renderHook(() => useOrgSettings());

		expect(result.current.isLoading).toBe(true);

		// Restore mock for subsequent tests
		vi.mocked(useJwt).mockReturnValue({
			jwt: "mock-jwt-token",
			isLoading: false,
		} as ReturnType<typeof useJwt>);
	});

	it("handles null settings response", async () => {
		mockGetOrganizationSettings.mockResolvedValue(null);

		const { result } = renderHook(() => useOrgSettings());

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.settings).toBeNull();
		expect(result.current.activityCode).toBeNull();
		expect(result.current.isConfigured).toBe(false);
	});
});

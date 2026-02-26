import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { useOrgSettings } from "./useOrgSettings";
import {
	OrgSettingsContext,
	type OrgSettingsContextValue,
} from "@/contexts/org-settings-context";
import type { OrganizationSettingsEntity } from "@/lib/api/organization-settings";

const mockSettings: OrganizationSettingsEntity = {
	id: "settings-1",
	organizationId: "org-1",
	obligatedSubjectKey: "SO-VEH",
	activityKey: "VEH",
	selfServiceMode: "disabled",
	selfServiceExpiryHours: 72,
	selfServiceRequiredSections: null,
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
};

function makeWrapper(value: OrgSettingsContextValue) {
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return React.createElement(
			OrgSettingsContext.Provider,
			{ value },
			children,
		);
	};
}

describe("useOrgSettings", () => {
	it("returns settings and derived values from context", () => {
		const { result } = renderHook(() => useOrgSettings(), {
			wrapper: makeWrapper({
				settings: mockSettings,
				isLoading: false,
				refresh: vi.fn(),
			}),
		});

		expect(result.current.settings).toEqual(mockSettings);
		expect(result.current.activityCode).toBe("VEH");
		expect(result.current.isConfigured).toBe(true);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it("sets isConfigured to false when activityKey is missing", () => {
		const { result } = renderHook(() => useOrgSettings(), {
			wrapper: makeWrapper({
				settings: { ...mockSettings, activityKey: "", obligatedSubjectKey: "" },
				isLoading: false,
				refresh: vi.fn(),
			}),
		});

		expect(result.current.isConfigured).toBe(false);
		expect(result.current.activityCode).toBeFalsy();
	});

	it("returns isLoading true when context is loading", () => {
		const { result } = renderHook(() => useOrgSettings(), {
			wrapper: makeWrapper({
				settings: null,
				isLoading: true,
				refresh: vi.fn(),
			}),
		});

		expect(result.current.isLoading).toBe(true);
		expect(result.current.settings).toBeNull();
	});

	it("returns null settings and not-configured when context has no settings", () => {
		const { result } = renderHook(() => useOrgSettings(), {
			wrapper: makeWrapper({
				settings: null,
				isLoading: false,
				refresh: vi.fn(),
			}),
		});

		expect(result.current.settings).toBeNull();
		expect(result.current.activityCode).toBeNull();
		expect(result.current.isConfigured).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it("exposes the refresh function from context", () => {
		const mockRefresh = vi.fn().mockResolvedValue(undefined);

		const { result } = renderHook(() => useOrgSettings(), {
			wrapper: makeWrapper({
				settings: mockSettings,
				isLoading: false,
				refresh: mockRefresh,
			}),
		});

		result.current.refresh();
		expect(mockRefresh).toHaveBeenCalledOnce();
	});

	it("uses default context values (isLoading true, settings null) when no provider is present", () => {
		const { result } = renderHook(() => useOrgSettings());

		expect(result.current.isLoading).toBe(true);
		expect(result.current.settings).toBeNull();
		expect(result.current.isConfigured).toBe(false);
	});
});

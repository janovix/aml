import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
	isLinkValid,
	getTimeRemaining,
	formatTimeRemaining,
	usePersistedUploadLink,
	cleanupExpiredLinks,
} from "./usePersistedUploadLink";
import type { CreateUploadLinkResponse } from "@/lib/api/doc-svc";

function makeLink(
	overrides?: Partial<CreateUploadLinkResponse>,
): CreateUploadLinkResponse {
	return {
		id: "link-1",
		organizationId: "org-1",
		requiredDocuments: ["mx_ine_front"],
		maxUploads: null,
		allowMultipleFiles: true,
		expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
		status: "ACTIVE",
		createdAt: new Date().toISOString(),
		...overrides,
	};
}

describe("isLinkValid", () => {
	it("returns false when expiresAt is missing", () => {
		const link = makeLink({ expiresAt: undefined as unknown as string });
		expect(isLinkValid(link)).toBe(false);
	});

	it("returns false when link expires in less than 5 minutes", () => {
		const link = makeLink({
			expiresAt: new Date(Date.now() + 4 * 60 * 1000).toISOString(), // 4 min
		});
		expect(isLinkValid(link)).toBe(false);
	});

	it("returns true when link has more than 5 minutes remaining", () => {
		const link = makeLink({
			expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
		});
		expect(isLinkValid(link)).toBe(true);
	});

	it("returns false when link is already expired", () => {
		const link = makeLink({
			expiresAt: new Date(Date.now() - 1000).toISOString(),
		});
		expect(isLinkValid(link)).toBe(false);
	});
});

describe("getTimeRemaining", () => {
	it("returns 0 when expiresAt is missing", () => {
		const link = makeLink({ expiresAt: undefined as unknown as string });
		expect(getTimeRemaining(link)).toBe(0);
	});

	it("returns 0 when link is expired", () => {
		const link = makeLink({
			expiresAt: new Date(Date.now() - 60000).toISOString(),
		});
		expect(getTimeRemaining(link)).toBe(0);
	});

	it("returns remaining seconds when link is valid", () => {
		const link = makeLink({
			expiresAt: new Date(Date.now() + 120_000).toISOString(), // 2 min
		});
		const remaining = getTimeRemaining(link);
		// Should be approximately 120 seconds (allow +-2s for execution time)
		expect(remaining).toBeGreaterThanOrEqual(118);
		expect(remaining).toBeLessThanOrEqual(120);
	});
});

describe("formatTimeRemaining", () => {
	it("formats hours and minutes", () => {
		expect(formatTimeRemaining(3661)).toBe("1h 1m");
	});

	it("formats hours with zero minutes", () => {
		expect(formatTimeRemaining(3600)).toBe("1h 0m");
	});

	it("formats minutes only", () => {
		expect(formatTimeRemaining(300)).toBe("5m");
	});

	it("formats seconds only when less than a minute", () => {
		expect(formatTimeRemaining(45)).toBe("45s");
	});

	it("formats zero seconds", () => {
		expect(formatTimeRemaining(0)).toBe("0s");
	});
});

describe("usePersistedUploadLink", () => {
	let localStorageMock: Record<string, string>;

	beforeEach(() => {
		localStorageMock = {};
		vi.stubGlobal("localStorage", {
			getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
			setItem: vi.fn((key: string, value: string) => {
				localStorageMock[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete localStorageMock[key];
			}),
			key: vi.fn((i: number) => Object.keys(localStorageMock)[i] ?? null),
			get length() {
				return Object.keys(localStorageMock).length;
			},
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns null and not loading when clientId is undefined", () => {
		const { result } = renderHook(() => usePersistedUploadLink(undefined));

		expect(result.current.persistedLink).toBeNull();
		expect(result.current.isLoading).toBe(false);
		expect(result.current.isValid).toBe(false);
	});

	it("returns null when no link is stored", () => {
		const { result } = renderHook(() => usePersistedUploadLink("client-1"));

		expect(result.current.persistedLink).toBeNull();
		expect(result.current.isLoading).toBe(false);
	});

	it("loads a valid persisted link from localStorage", () => {
		const link = makeLink();
		const persisted = {
			link,
			clientId: "client-1",
			selectedDocuments: ["mx_ine_front"],
			createdAt: new Date().toISOString(),
		};
		localStorageMock["janovix_upload_link_client-1"] =
			JSON.stringify(persisted);

		const { result } = renderHook(() => usePersistedUploadLink("client-1"));

		expect(result.current.persistedLink).not.toBeNull();
		expect(result.current.persistedLink?.clientId).toBe("client-1");
		expect(result.current.isValid).toBe(true);
	});

	it("cleans up expired link from localStorage", () => {
		const expiredLink = makeLink({
			expiresAt: new Date(Date.now() - 60000).toISOString(),
		});
		const persisted = {
			link: expiredLink,
			clientId: "client-1",
			selectedDocuments: [],
			createdAt: new Date().toISOString(),
		};
		localStorageMock["janovix_upload_link_client-1"] =
			JSON.stringify(persisted);

		const { result } = renderHook(() => usePersistedUploadLink("client-1"));

		expect(result.current.persistedLink).toBeNull();
		expect(localStorage.removeItem).toHaveBeenCalledWith(
			"janovix_upload_link_client-1",
		);
	});

	it("saveLink stores link and updates state", () => {
		const { result } = renderHook(() => usePersistedUploadLink("client-1"));
		const link = makeLink();

		act(() => {
			result.current.saveLink(link, ["mx_ine_front"]);
		});

		expect(result.current.persistedLink).not.toBeNull();
		expect(result.current.persistedLink?.clientId).toBe("client-1");
		expect(localStorage.setItem).toHaveBeenCalled();
	});

	it("clearLink removes link from state and localStorage", () => {
		const link = makeLink();
		const persisted = {
			link,
			clientId: "client-1",
			selectedDocuments: [],
			createdAt: new Date().toISOString(),
		};
		localStorageMock["janovix_upload_link_client-1"] =
			JSON.stringify(persisted);

		const { result } = renderHook(() => usePersistedUploadLink("client-1"));

		expect(result.current.persistedLink).not.toBeNull();

		act(() => {
			result.current.clearLink();
		});

		expect(result.current.persistedLink).toBeNull();
		expect(localStorage.removeItem).toHaveBeenCalledWith(
			"janovix_upload_link_client-1",
		);
	});

	it("saveLink is a no-op when clientId is undefined", () => {
		const { result } = renderHook(() => usePersistedUploadLink(undefined));

		act(() => {
			result.current.saveLink(makeLink(), []);
		});

		expect(localStorage.setItem).not.toHaveBeenCalled();
	});

	it("clearLink is a no-op when clientId is undefined", () => {
		const { result } = renderHook(() => usePersistedUploadLink(undefined));

		act(() => {
			result.current.clearLink();
		});

		expect(localStorage.removeItem).not.toHaveBeenCalled();
	});

	it("handles invalid JSON in localStorage gracefully", () => {
		localStorageMock["janovix_upload_link_client-1"] = "not-json";
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const { result } = renderHook(() => usePersistedUploadLink("client-1"));

		expect(result.current.persistedLink).toBeNull();
		expect(result.current.isLoading).toBe(false);
		consoleSpy.mockRestore();
	});
});

describe("cleanupExpiredLinks", () => {
	let localStorageMock: Record<string, string>;

	beforeEach(() => {
		localStorageMock = {};
		vi.stubGlobal("localStorage", {
			getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
			setItem: vi.fn((key: string, value: string) => {
				localStorageMock[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete localStorageMock[key];
			}),
			key: vi.fn((i: number) => Object.keys(localStorageMock)[i] ?? null),
			get length() {
				return Object.keys(localStorageMock).length;
			},
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("removes expired links from localStorage", () => {
		const expiredLink = makeLink({
			expiresAt: new Date(Date.now() - 60000).toISOString(),
		});
		localStorageMock["janovix_upload_link_client-1"] = JSON.stringify({
			link: expiredLink,
			clientId: "client-1",
			selectedDocuments: [],
			createdAt: new Date().toISOString(),
		});

		cleanupExpiredLinks();

		expect(localStorage.removeItem).toHaveBeenCalledWith(
			"janovix_upload_link_client-1",
		);
	});

	it("keeps valid links in localStorage", () => {
		const validLink = makeLink();
		localStorageMock["janovix_upload_link_client-1"] = JSON.stringify({
			link: validLink,
			clientId: "client-1",
			selectedDocuments: [],
			createdAt: new Date().toISOString(),
		});

		cleanupExpiredLinks();

		expect(localStorage.removeItem).not.toHaveBeenCalled();
	});

	it("removes entries with invalid JSON", () => {
		localStorageMock["janovix_upload_link_bad"] = "not-valid-json";

		cleanupExpiredLinks();

		expect(localStorage.removeItem).toHaveBeenCalledWith(
			"janovix_upload_link_bad",
		);
	});

	it("ignores non-upload-link keys", () => {
		localStorageMock["other_key"] = "some-value";

		cleanupExpiredLinks();

		expect(localStorage.removeItem).not.toHaveBeenCalled();
	});
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionStorageForm } from "./useSessionStorageForm";

const SESSION_STORAGE_PREFIX = "aml_form_draft_";

describe("useSessionStorageForm", () => {
	const testKey = "test_form";
	const storageKey = `${SESSION_STORAGE_PREFIX}${testKey}`;

	interface TestFormData {
		name: string;
		email: string;
		age?: number;
	}

	const initialData: TestFormData = {
		name: "",
		email: "",
		age: undefined,
	};

	beforeEach(() => {
		// Clear session storage before each test
		sessionStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("initializes with initial data when session storage is empty", () => {
		const { result } = renderHook(() =>
			useSessionStorageForm(testKey, initialData),
		);

		const [formData] = result.current;
		expect(formData).toEqual(initialData);
	});

	it("initializes with stored data from session storage", () => {
		const storedData: TestFormData = {
			name: "John Doe",
			email: "john@example.com",
			age: 30,
		};
		sessionStorage.setItem(storageKey, JSON.stringify(storedData));

		const { result } = renderHook(() =>
			useSessionStorageForm(testKey, initialData),
		);

		const [formData] = result.current;
		expect(formData).toEqual(storedData);
	});

	it("merges stored data with initial data for new fields", () => {
		const storedData = {
			name: "John Doe",
			email: "john@example.com",
			// age is missing
		};
		sessionStorage.setItem(storageKey, JSON.stringify(storedData));

		const { result } = renderHook(() =>
			useSessionStorageForm(testKey, initialData),
		);

		const [formData] = result.current;
		expect(formData).toEqual({
			name: "John Doe",
			email: "john@example.com",
			age: undefined, // From initial data
		});
	});

	it("updates session storage when form data changes", () => {
		const { result } = renderHook(() =>
			useSessionStorageForm(testKey, initialData),
		);

		const [, setFormData] = result.current;

		act(() => {
			setFormData({ name: "Jane Doe", email: "jane@example.com" });
		});

		const stored = sessionStorage.getItem(storageKey);
		expect(stored).not.toBeNull();
		expect(JSON.parse(stored!)).toEqual({
			name: "Jane Doe",
			email: "jane@example.com",
		});
	});

	it("clears session storage when clearStorage is called", () => {
		const storedData: TestFormData = {
			name: "John Doe",
			email: "john@example.com",
		};
		sessionStorage.setItem(storageKey, JSON.stringify(storedData));

		const { result } = renderHook(() =>
			useSessionStorageForm(testKey, initialData),
		);

		const [, , clearStorage] = result.current;

		act(() => {
			clearStorage();
		});

		expect(sessionStorage.getItem(storageKey)).toBeNull();
	});

	it("handles corrupted session storage data gracefully", () => {
		const consoleWarnSpy = vi
			.spyOn(console, "warn")
			.mockImplementation(() => {});
		sessionStorage.setItem(storageKey, "invalid json {{{");

		const { result } = renderHook(() =>
			useSessionStorageForm(testKey, initialData),
		);

		const [formData] = result.current;
		expect(formData).toEqual(initialData);
		expect(consoleWarnSpy).toHaveBeenCalled();

		consoleWarnSpy.mockRestore();
	});

	it("removes corrupted data from session storage", () => {
		const consoleWarnSpy = vi
			.spyOn(console, "warn")
			.mockImplementation(() => {});
		sessionStorage.setItem(storageKey, "invalid json {{{");

		renderHook(() => useSessionStorageForm(testKey, initialData));

		// Corrupted data should be removed
		expect(sessionStorage.getItem(storageKey)).toBeNull();

		consoleWarnSpy.mockRestore();
	});

	it("uses different storage keys for different form keys", () => {
		const form1Data = { name: "Form 1", email: "" };
		const form2Data = { name: "Form 2", email: "" };

		const { result: result1 } = renderHook(() =>
			useSessionStorageForm("form1", initialData),
		);
		const { result: result2 } = renderHook(() =>
			useSessionStorageForm("form2", initialData),
		);

		act(() => {
			result1.current[1](form1Data);
		});

		act(() => {
			result2.current[1](form2Data);
		});

		expect(sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}form1`)).toBe(
			JSON.stringify(form1Data),
		);
		expect(sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}form2`)).toBe(
			JSON.stringify(form2Data),
		);
	});

	it("does not save to session storage on initial render", () => {
		// This test verifies that the initial render doesn't save to storage
		// (which would overwrite existing stored data with initial data)
		const storedData: TestFormData = {
			name: "Stored Name",
			email: "stored@example.com",
		};
		sessionStorage.setItem(storageKey, JSON.stringify(storedData));

		renderHook(() => useSessionStorageForm(testKey, initialData));

		// Session storage should still have the stored data, not the initial data
		const stored = sessionStorage.getItem(storageKey);
		expect(JSON.parse(stored!)).toEqual(storedData);
	});

	it("preserves form data through functional updates", () => {
		const { result } = renderHook(() =>
			useSessionStorageForm(testKey, initialData),
		);

		const [, setFormData] = result.current;

		act(() => {
			setFormData((prev) => ({ ...prev, name: "Updated Name" }));
		});

		const [formData] = result.current;
		expect(formData.name).toBe("Updated Name");
		expect(formData.email).toBe("");
	});

	it("returns stable clearStorage function reference", () => {
		const { result, rerender } = renderHook(() =>
			useSessionStorageForm(testKey, initialData),
		);

		const firstClearStorage = result.current[2];

		rerender();

		const secondClearStorage = result.current[2];

		expect(firstClearStorage).toBe(secondClearStorage);
	});
});

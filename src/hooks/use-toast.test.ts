import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { toast as sonnerToast } from "sonner";
import { useToast } from "./use-toast";

type ToastMock = Mock & {
	success: Mock;
	error: Mock;
	warning: Mock;
	info: Mock;
	loading: Mock;
};

const toastMock = vi.hoisted(() => {
	const mock = vi.fn() as ToastMock;
	mock.success = vi.fn();
	mock.error = vi.fn();
	mock.warning = vi.fn();
	mock.info = vi.fn();
	mock.loading = vi.fn();
	return mock;
});

vi.mock("sonner", () => ({ toast: toastMock }));

describe("useToast", () => {
	beforeEach(() => {
		toastMock.mockClear();
		toastMock.success.mockClear();
		toastMock.error.mockClear();
		toastMock.warning.mockClear();
		toastMock.info.mockClear();
		toastMock.loading.mockClear();
	});

	it("uses default toast when no variant is provided", () => {
		const { result } = renderHook(() => useToast());

		act(() => {
			result.current.toast({ title: "Default", description: "Hello" });
		});

		expect(sonnerToast).toHaveBeenCalledWith("Default", {
			description: "Hello",
		});
	});

	it("maps success, warning, info, and loading variants", () => {
		const { result } = renderHook(() => useToast());

		act(() => {
			result.current.toast({ title: "Success", variant: "success" });
			result.current.toast({ title: "Warning", variant: "warning" });
			result.current.toast({ title: "Info", variant: "info" });
			result.current.toast({ title: "Loading", variant: "loading" });
		});

		expect(sonnerToast.success).toHaveBeenCalledWith("Success", {
			description: undefined,
		});
		expect(sonnerToast.warning).toHaveBeenCalledWith("Warning", {
			description: undefined,
		});
		expect(sonnerToast.info).toHaveBeenCalledWith("Info", {
			description: undefined,
		});
		expect(sonnerToast.loading).toHaveBeenCalledWith("Loading", {
			description: undefined,
		});
	});

	it("maps destructive, error, and failure variants to error", () => {
		const { result } = renderHook(() => useToast());

		act(() => {
			result.current.toast({ title: "Destructive", variant: "destructive" });
			result.current.toast({ title: "Error", variant: "error" });
			result.current.toast({ title: "Failure", variant: "failure" });
		});

		expect(sonnerToast.error).toHaveBeenCalledWith("Destructive", {
			description: undefined,
		});
		expect(sonnerToast.error).toHaveBeenCalledWith("Error", {
			description: undefined,
		});
		expect(sonnerToast.error).toHaveBeenCalledWith("Failure", {
			description: undefined,
		});
	});
});

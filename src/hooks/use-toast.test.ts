import { describe, expect, it, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useToast } from "./use-toast";

describe("useToast", () => {
	it("initializes with empty toasts array", () => {
		const { result } = renderHook(() => useToast());

		expect(result.current.toasts).toEqual([]);
		expect(typeof result.current.toast).toBe("function");
	});

	it("adds a toast when toast function is called", () => {
		const { result } = renderHook(() => useToast());

		act(() => {
			result.current.toast({
				title: "Test Title",
				description: "Test Description",
			});
		});

		expect(result.current.toasts).toHaveLength(1);
		expect(result.current.toasts[0]).toEqual({
			title: "Test Title",
			description: "Test Description",
		});
	});

	it("adds multiple toasts", () => {
		const { result } = renderHook(() => useToast());

		act(() => {
			result.current.toast({ title: "First" });
			result.current.toast({ title: "Second" });
		});

		expect(result.current.toasts).toHaveLength(2);
	});

	it("handles toast without description", () => {
		const { result } = renderHook(() => useToast());

		act(() => {
			result.current.toast({ title: "Title Only" });
		});

		expect(result.current.toasts[0]).toEqual({
			title: "Title Only",
		});
	});

	it("handles destructive variant", () => {
		const { result } = renderHook(() => useToast());

		act(() => {
			result.current.toast({
				title: "Error",
				variant: "destructive",
			});
		});

		expect(result.current.toasts[0]).toEqual({
			title: "Error",
			variant: "destructive",
		});
	});

	it("removes toast after 3 seconds", () => {
		vi.useFakeTimers();
		const { result } = renderHook(() => useToast());

		act(() => {
			result.current.toast({ title: "Temporary" });
		});

		expect(result.current.toasts).toHaveLength(1);

		act(() => {
			vi.advanceTimersByTime(3000);
		});

		// After advancing timers, the toast should be removed
		expect(result.current.toasts).toHaveLength(0);

		vi.useRealTimers();
	});
});

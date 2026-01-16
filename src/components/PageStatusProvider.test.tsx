import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import {
	PageStatusProvider,
	usePageStatus,
	useSetPageStatus,
	type PageStatus,
} from "./PageStatusProvider";

// Clean up after each test
afterEach(() => {
	cleanup();
});

// Test component that displays current status
function StatusDisplay() {
	const { status } = usePageStatus();
	return <div data-testid="status">{status}</div>;
}

// Test component that allows setting status
function StatusSetter({ status }: { status: PageStatus }) {
	useSetPageStatus(status);
	return null;
}

describe("PageStatusProvider", () => {
	it("provides initial normal status", () => {
		render(
			<PageStatusProvider>
				<StatusDisplay />
			</PageStatusProvider>,
		);

		expect(screen.getByTestId("status")).toHaveTextContent("normal");
	});

	it("allows setting status via usePageStatus", () => {
		function TestComponent() {
			const { status, setStatus } = usePageStatus();
			return (
				<>
					<div data-testid="status">{status}</div>
					<button onClick={() => setStatus("not-found")}>Set Not Found</button>
				</>
			);
		}

		render(
			<PageStatusProvider>
				<TestComponent />
			</PageStatusProvider>,
		);

		expect(screen.getByTestId("status")).toHaveTextContent("normal");

		act(() => {
			screen.getByRole("button").click();
		});

		expect(screen.getByTestId("status")).toHaveTextContent("not-found");
	});

	it("useSetPageStatus sets status on mount", () => {
		render(
			<PageStatusProvider>
				<StatusSetter status="not-found" />
				<StatusDisplay />
			</PageStatusProvider>,
		);

		// Status should be set after mount
		expect(screen.getByTestId("status")).toHaveTextContent("not-found");
	});

	it.each([
		"normal",
		"not-found",
		"error",
		"forbidden",
		"unauthorized",
	] as PageStatus[])("supports page status type: %s", (expectedStatus) => {
		function TestComponent() {
			const { status, setStatus } = usePageStatus();
			return (
				<>
					<div data-testid="status">{status}</div>
					<button onClick={() => setStatus(expectedStatus)}>Set</button>
				</>
			);
		}

		render(
			<PageStatusProvider>
				<TestComponent />
			</PageStatusProvider>,
		);

		act(() => {
			screen.getByRole("button").click();
		});

		expect(screen.getByTestId("status")).toHaveTextContent(expectedStatus);
	});

	it("throws error when usePageStatus is used outside provider", () => {
		// Suppress console.error for this test since we expect an error
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => {
			render(<StatusDisplay />);
		}).toThrow("usePageStatus must be used within a PageStatusProvider");

		consoleSpy.mockRestore();
	});
});

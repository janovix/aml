import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	ExternalLinkDialog,
	useExternalLinkRedirect,
} from "./ExternalLinkDialog";

describe("ExternalLinkDialog (UI)", () => {
	const openFn = vi.fn();

	beforeEach(() => {
		openFn.mockReset();
		vi.spyOn(window, "open").mockImplementation(openFn as typeof window.open);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("shows hostname and url, confirm calls onConfirm", async () => {
		const user = userEvent.setup();
		const onConfirm = vi.fn();
		const onCancel = vi.fn();

		render(
			<ExternalLinkDialog
				open
				url="https://evil.example/path"
				onConfirm={onConfirm}
				onCancel={onCancel}
			/>,
		);

		expect(screen.getByText("evil.example")).toBeInTheDocument();
		expect(
			screen.getByText("https://evil.example/path", { exact: false }),
		).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: /Continuar/i }));
		expect(onConfirm).toHaveBeenCalled();
	});

	it("cancel invokes onCancel", async () => {
		const user = userEvent.setup();
		const onCancel = vi.fn();

		render(
			<ExternalLinkDialog
				open
				url="https://a.test"
				onConfirm={vi.fn()}
				onCancel={onCancel}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /Cancelar/i }));
		expect(onCancel).toHaveBeenCalled();
	});
});

describe("useExternalLinkRedirect", () => {
	const openFn = vi.fn();

	beforeEach(() => {
		openFn.mockReset();
		vi.spyOn(window, "open").mockImplementation(openFn as typeof window.open);
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	function HookProbe() {
		const { handleExternalLink, pendingUrl, confirm, cancel } =
			useExternalLinkRedirect();
		return (
			<div>
				<button
					type="button"
					onClick={() => handleExternalLink("https://x.test")}
				>
					go
				</button>
				<span data-testid="pending">{pendingUrl ?? ""}</span>
				<button type="button" onClick={confirm}>
					confirm
				</button>
				<button type="button" onClick={cancel}>
					cancel
				</button>
			</div>
		);
	}

	it("queues url then confirm opens window", async () => {
		const user = userEvent.setup();
		render(<HookProbe />);

		await user.click(screen.getByRole("button", { name: "go" }));
		expect(screen.getByTestId("pending")).toHaveTextContent("https://x.test");

		await user.click(screen.getByRole("button", { name: "confirm" }));
		expect(openFn).toHaveBeenCalledWith(
			"https://x.test",
			"_blank",
			"noopener,noreferrer",
		);
		expect(screen.getByTestId("pending")).toHaveTextContent("");
	});

	it("opens immediately when skip-warning is stored", async () => {
		localStorage.setItem("janovix_skip_external_link_warning", "true");
		const user = userEvent.setup();
		render(<HookProbe />);

		await user.click(screen.getByRole("button", { name: "go" }));
		expect(openFn).toHaveBeenCalled();
		expect(screen.getByTestId("pending")).toHaveTextContent("");
	});
});

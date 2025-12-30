import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	Combobox,
	ComboboxTrigger,
	ComboboxContent,
	ComboboxList,
	ComboboxItem,
} from "./combobox";

describe("Combobox", () => {
	beforeEach(() => {
		// Reset scroll position
		window.scrollTo(0, 0);
	});

	afterEach(() => {
		cleanup();
	});

	it("renders trigger button", () => {
		render(
			<Combobox>
				<ComboboxTrigger>Select option</ComboboxTrigger>
				<ComboboxContent>
					<ComboboxList>
						<ComboboxItem value="1">Option 1</ComboboxItem>
					</ComboboxList>
				</ComboboxContent>
			</Combobox>,
		);

		expect(screen.getByRole("button")).toHaveTextContent("Select option");
	});

	it("opens content when trigger is clicked", async () => {
		const user = userEvent.setup();

		render(
			<Combobox>
				<ComboboxTrigger>Select option</ComboboxTrigger>
				<ComboboxContent>
					<ComboboxList>
						<ComboboxItem value="1">Option 1</ComboboxItem>
					</ComboboxList>
				</ComboboxContent>
			</Combobox>,
		);

		const trigger = screen.getByRole("button");
		await user.click(trigger);

		expect(await screen.findByText("Option 1")).toBeInTheDocument();
	});

	it("closes content when item is selected", async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();

		render(
			<Combobox>
				<ComboboxTrigger>Select option</ComboboxTrigger>
				<ComboboxContent>
					<ComboboxList>
						<ComboboxItem value="1" onSelect={onSelect}>
							Option 1
						</ComboboxItem>
					</ComboboxList>
				</ComboboxContent>
			</Combobox>,
		);

		const trigger = screen.getByRole("button");
		await user.click(trigger);

		const option = await screen.findByText("Option 1");
		await user.click(option);

		expect(onSelect).toHaveBeenCalled();
		// Content should be closed
		expect(screen.queryByText("Option 1")).not.toBeInTheDocument();
	});

	it("closes on Escape key", async () => {
		const user = userEvent.setup();

		render(
			<Combobox>
				<ComboboxTrigger>Select option</ComboboxTrigger>
				<ComboboxContent>
					<ComboboxList>
						<ComboboxItem value="1">Option 1</ComboboxItem>
					</ComboboxList>
				</ComboboxContent>
			</Combobox>,
		);

		await user.click(screen.getByRole("button"));
		expect(await screen.findByText("Option 1")).toBeInTheDocument();

		await user.keyboard("{Escape}");
		expect(screen.queryByText("Option 1")).not.toBeInTheDocument();
	});

	it("uses fixed positioning relative to viewport (not document)", async () => {
		const user = userEvent.setup();

		// Mock getBoundingClientRect to return consistent values
		const mockRect = {
			top: 100,
			left: 50,
			bottom: 140,
			right: 250,
			width: 200,
			height: 40,
			x: 50,
			y: 100,
			toJSON: () => ({}),
		};

		// Simulate scroll offset
		Object.defineProperty(window, "scrollY", { value: 500, writable: true });
		Object.defineProperty(window, "scrollX", { value: 100, writable: true });

		render(
			<Combobox>
				<ComboboxTrigger>Select option</ComboboxTrigger>
				<ComboboxContent>
					<ComboboxList>
						<ComboboxItem value="1">Option 1</ComboboxItem>
					</ComboboxList>
				</ComboboxContent>
			</Combobox>,
		);

		const trigger = screen.getByRole("button");

		// Mock getBoundingClientRect on the trigger
		vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue(mockRect);

		await user.click(trigger);

		// Wait for content to render
		const content = await screen.findByRole("listbox");
		const contentContainer = content.closest('[data-slot="combobox-content"]');

		expect(contentContainer).toBeInTheDocument();

		// The content should be positioned relative to viewport (fixed positioning)
		// It should NOT include scroll offsets
		// Position should be approximately: top = rect.bottom (140) + gap (4) = 144
		// NOT: rect.bottom + scrollY + gap = 140 + 500 + 4 = 644
		const style = (contentContainer as HTMLElement).style;
		const topValue = parseFloat(style.top);

		// With fixed positioning, top should be close to rect.bottom + gap (144px)
		// NOT adjusted by scroll (which would be 644px)
		expect(topValue).toBeLessThan(200); // Should be around 144, definitely less than 200
		expect(topValue).toBeGreaterThan(100); // Should be below the trigger

		// Reset scroll
		Object.defineProperty(window, "scrollY", { value: 0, writable: true });
		Object.defineProperty(window, "scrollX", { value: 0, writable: true });
	});

	it("supports controlled open state", async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();

		render(
			<Combobox open={false} onOpenChange={onOpenChange}>
				<ComboboxTrigger>Select option</ComboboxTrigger>
				<ComboboxContent>
					<ComboboxList>
						<ComboboxItem value="1">Option 1</ComboboxItem>
					</ComboboxList>
				</ComboboxContent>
			</Combobox>,
		);

		await user.click(screen.getByRole("button"));

		// Since it's controlled and open=false, content shouldn't appear
		// but onOpenChange should be called
		expect(onOpenChange).toHaveBeenCalledWith(true);
	});
});
